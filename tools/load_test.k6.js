/**
 * PaddleGrid load test — k6
 *
 * Three realistic mixed workloads:
 *   • Feed scrollers   (heavy reads from social_posts)
 *   • Court browsers   (court_availability_blocks lookups)
 *   • Bookers          (insert into bookings — the most contention-heavy path)
 *
 * Usage:
 *   brew install k6
 *   k6 run -e SUPABASE_URL=https://qasofigsvnnaqsqrjenk.supabase.co \
 *          -e SUPABASE_ANON_KEY=eyJ... \
 *          -e FACILITY_ID=bfb8aa81-fca9-48d9-b697-d13bba78430e \
 *          load_test.k6.js
 *
 * Default profile (the "what breaks at 1k concurrent" question):
 *   - ramps to 1000 concurrent VUs over 2 min
 *   - holds 1000 for 5 min
 *   - ramps down to 0 over 1 min
 *
 * Tune via env: K6_PEAK_VUS, K6_HOLD_MIN
 */
import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';
import { uuidv4 } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

const SUPABASE_URL      = __ENV.SUPABASE_URL      || 'https://qasofigsvnnaqsqrjenk.supabase.co';
const SUPABASE_ANON_KEY = __ENV.SUPABASE_ANON_KEY || (() => { throw new Error('Set SUPABASE_ANON_KEY env'); })();
const FACILITY_ID       = __ENV.FACILITY_ID       || 'bfb8aa81-fca9-48d9-b697-d13bba78430e';

const PEAK_VUS = parseInt(__ENV.K6_PEAK_VUS || '1000', 10);
const HOLD_MIN = parseInt(__ENV.K6_HOLD_MIN || '5', 10);

export const options = {
  scenarios: {
    mixed: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m',           target: PEAK_VUS },
        { duration: `${HOLD_MIN}m`, target: PEAK_VUS },
        { duration: '1m',           target: 0 },
      ],
      gracefulRampDown: '30s',
    },
  },
  thresholds: {
    'http_req_duration{kind:feed}':     ['p(95)<800',  'p(99)<2500'],
    'http_req_duration{kind:courts}':   ['p(95)<600',  'p(99)<1500'],
    'http_req_duration{kind:booking}':  ['p(95)<1500', 'p(99)<4000'],
    'http_req_failed':                  ['rate<0.02'],   // <2% errors at peak
    'booking_conflicts':                [],              // record only, don't fail
  },
  tags: { project: 'paddlegrid' },
};

const feedDur     = new Trend('feed_duration',    true);
const courtsDur   = new Trend('courts_duration',  true);
const bookingDur  = new Trend('booking_duration', true);
const errorRate   = new Rate('errors');
const conflicts   = new Counter('booking_conflicts');

const headers = {
  apikey:        SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type':'application/json',
};

function rand(min, max) { return Math.floor(Math.random() * (max - min)) + min; }
function todayPlus(days) {
  const d = new Date(); d.setDate(d.getDate() + days);
  return d.toISOString().substring(0, 10);
}

export default function () {
  const role = Math.random();
  if (role < 0.55)      feedScroller();
  else if (role < 0.90) courtBrowser();
  else                  booker();
}

/* ───── Feed scroller — heaviest weight (55%) ───── */
function feedScroller() {
  group('feed', () => {
    const res = http.get(
      `${SUPABASE_URL}/rest/v1/social_posts?select=id,content,author_id,created_at,profiles!social_posts_author_id_fkey(full_name,profile_picture_url)&order=created_at.desc&limit=20`,
      { headers, tags: { kind: 'feed' } }
    );
    feedDur.add(res.timings.duration);
    check(res, { 'feed 200': r => r.status === 200 }) || errorRate.add(1);
  });
  sleep(rand(2, 6));
}

/* ───── Court browser — checks availability (35%) ───── */
function courtBrowser() {
  group('courts', () => {
    const date = todayPlus(rand(0, 14));
    const res = http.get(
      `${SUPABASE_URL}/rest/v1/court_availability_blocks?select=court_id,start_time,end_time&booking_date=eq.${date}`,
      { headers, tags: { kind: 'courts' } }
    );
    courtsDur.add(res.timings.duration);
    check(res, { 'courts 200': r => r.status === 200 }) || errorRate.add(1);

    // Half of browsers also load the courts list
    if (Math.random() < 0.5) {
      const r2 = http.get(
        `${SUPABASE_URL}/rest/v1/courts?select=id,name,court_number&facility_id=eq.${FACILITY_ID}`,
        { headers, tags: { kind: 'courts' } }
      );
      check(r2, { 'courts list 200': r => r.status === 200 }) || errorRate.add(1);
    }
  });
  sleep(rand(1, 4));
}

/* ───── Booker — write contention (10%) ───── */
function booker() {
  group('booking', () => {
    // We can't really insert with anon key (RLS will block); we measure the
    // server's response to a write attempt — that exercises the same auth +
    // policy evaluation path the real client hits.
    const body = JSON.stringify({
      court_id:      uuidv4(),
      user_id:       uuidv4(),
      booking_date:  todayPlus(rand(0, 7)),
      start_time:    `${String(rand(7, 21)).padStart(2,'0')}:00:00`,
      end_time:      `${String(rand(8, 22)).padStart(2,'0')}:00:00`,
      duration_hours: 1,
      status:        'pending',
      total_amount:  25,
      facility_id:   FACILITY_ID,
    });
    const res = http.post(
      `${SUPABASE_URL}/rest/v1/bookings`,
      body,
      { headers: { ...headers, Prefer: 'return=minimal' }, tags: { kind: 'booking' } }
    );
    bookingDur.add(res.timings.duration);

    // Expected: 201 created, 403 (RLS denied — that's fine for an anon hit),
    // or 409 (unique-constraint conflict — slot taken). Anything else is bad.
    const ok = res.status === 201 || res.status === 403 || res.status === 401 || res.status === 409;
    if (res.status === 409) conflicts.add(1);
    check(res, { 'booking handled': () => ok }) || errorRate.add(1);
  });
  sleep(rand(5, 12));
}

export function handleSummary(data) {
  const summary = {
    peak_vus: PEAK_VUS,
    hold_min: HOLD_MIN,
    durations: {
      feed_p95:    Math.round(data.metrics.feed_duration?.values['p(95)']    || 0),
      feed_p99:    Math.round(data.metrics.feed_duration?.values['p(99)']    || 0),
      courts_p95:  Math.round(data.metrics.courts_duration?.values['p(95)']  || 0),
      courts_p99:  Math.round(data.metrics.courts_duration?.values['p(99)']  || 0),
      booking_p95: Math.round(data.metrics.booking_duration?.values['p(95)'] || 0),
      booking_p99: Math.round(data.metrics.booking_duration?.values['p(99)'] || 0),
    },
    error_rate:        (data.metrics.errors?.values?.rate || 0).toFixed(4),
    booking_conflicts: data.metrics.booking_conflicts?.values?.count || 0,
    http_failed:       (data.metrics.http_req_failed?.values?.rate || 0).toFixed(4),
  };
  return {
    'stdout':                   '\n' + JSON.stringify(summary, null, 2) + '\n',
    'load_test_summary.json':   JSON.stringify(summary, null, 2),
  };
}
