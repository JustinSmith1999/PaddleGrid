# Monitoring & Alerting Setup Guide

This guide explains how to set up comprehensive monitoring and alerting for PaddleGrid at scale.

## 1. Sentry Error Tracking (Configured)

Sentry is already configured in the application. To activate:

1. Create a Sentry account at https://sentry.io
2. Create a new project for PaddleGrid
3. Get your DSN and add to `.env`:
```bash
VITE_SENTRY_DSN=https://your-key@o123456.ingest.sentry.io/123456
SENTRY_ORG=your-org
SENTRY_PROJECT=paddlegrid
SENTRY_AUTH_TOKEN=your-auth-token
```

Features enabled:
- Error tracking with stack traces
- Performance monitoring (100% trace sample rate)
- Session replay (10% sample rate, 100% on errors)
- Breadcrumbs for debugging
- User context and tags

## 2. Supabase Monitoring (Built-in)

Supabase provides built-in monitoring. Access at: https://supabase.com/dashboard

### Key Metrics to Monitor:
- Database connections (alert if > 80% capacity)
- Query performance (slow query log)
- API request rate and latency
- Storage usage
- Edge function invocations and errors

### Recommended Alerts:
```
Alert Type: Database
- CPU usage > 80% for 5 minutes
- Connection count > 80% of limit
- Replication lag > 10 seconds

Alert Type: API
- Error rate > 5% for 5 minutes
- P95 latency > 2 seconds
- Request rate spike > 200% baseline

Alert Type: Storage
- Storage usage > 85% of quota
- Bandwidth usage > 90% of quota
```

## 3. Uptime Monitoring

Recommended services:
- **BetterStack** (https://betterstack.com)
- **UptimeRobot** (https://uptimerobot.com)
- **Pingdom** (https://pingdom.com)

### Endpoints to Monitor:
```
Primary Application: https://your-domain.com
- Check interval: 1 minute
- Alert after: 2 consecutive failures

Health Check: https://your-domain.com/api/health
- Expected status: 200
- Check interval: 1 minute

Critical Edge Functions:
- courtreserve-sync
- stripe-webhook
- booking-expiry-check
```

## 4. Performance Monitoring

### Web Vitals Tracking

Add to your application:
```typescript
// src/lib/webVitals.ts
import { onCLS, onFID, onFCP, onLCP, onTTFB } from 'web-vitals';
import * as Sentry from '@sentry/react';

function sendToAnalytics(metric: any) {
  // Send to Sentry
  Sentry.addBreadcrumb({
    category: 'web-vitals',
    message: metric.name,
    level: 'info',
    data: {
      value: metric.value,
      rating: metric.rating,
    },
  });

  // Send to Google Analytics if configured
  if (window.gtag) {
    window.gtag('event', metric.name, {
      value: Math.round(metric.value),
      metric_id: metric.id,
      metric_value: metric.value,
      metric_delta: metric.delta,
    });
  }
}

export function initWebVitals() {
  onCLS(sendToAnalytics);
  onFID(sendToAnalytics);
  onFCP(sendToAnalytics);
  onLCP(sendToAnalytics);
  onTTFB(sendToAnalytics);
}
```

### Target Metrics:
- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1
- **TTFB** (Time to First Byte): < 600ms

## 5. Custom Business Metrics

Track important business events in Supabase:

```sql
-- Create metrics tracking table
CREATE TABLE IF NOT EXISTS application_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name text NOT NULL,
  metric_value numeric NOT NULL,
  metadata jsonb DEFAULT '{}',
  recorded_at timestamptz DEFAULT now()
);

CREATE INDEX idx_metrics_name_time
  ON application_metrics (metric_name, recorded_at DESC);
```

### Metrics to Track:
```typescript
// src/lib/metrics.ts
export async function trackMetric(
  name: string,
  value: number,
  metadata: Record<string, any> = {}
) {
  await supabase.from('application_metrics').insert({
    metric_name: name,
    metric_value: value,
    metadata,
  });
}

// Usage examples:
trackMetric('booking_created', 1, { court_id, user_id });
trackMetric('series_registration', 1, { series_id, price });
trackMetric('post_engagement', post.likes_count + post.comments_count);
trackMetric('user_signup', 1, { signup_type: 'email' });
```

## 6. Log Aggregation

For edge functions, consider:
- **Logflare** (built into Supabase)
- **Better Stack Logs**
- **Datadog Logs**

Access Supabase logs:
```bash
# Install Supabase CLI
npm install -g supabase

# View edge function logs
supabase functions logs courtreserve-sync --tail
```

## 7. Alert Channels

Configure multiple alert channels:

### Email Alerts
- Add team emails to Supabase project settings
- Configure Sentry email notifications

### Slack Integration
1. Create Slack webhook: https://api.slack.com/messaging/webhooks
2. Add to Sentry integrations
3. Add to Supabase webhook settings

### PagerDuty (for critical alerts)
1. Create PagerDuty service
2. Integrate with Sentry for critical errors
3. Set escalation policies

## 8. Dashboard Setup

### Grafana Dashboard (Optional but Recommended)

For advanced monitoring, set up Grafana:

```yaml
# Metrics to visualize:
- Active users (last 5 min, 1 hour, 24 hours)
- Booking creation rate
- API response times (p50, p95, p99)
- Error rates by endpoint
- Database query performance
- Cache hit rates (React Query)
- Edge function invocations
- CourtReserve sync success rate
```

## 9. Rate Limit Monitoring

Monitor rate limit usage:

```sql
-- Query to check rate limit violations
SELECT
  endpoint,
  COUNT(*) as requests,
  COUNT(CASE WHEN request_count >= 100 THEN 1 END) as violations
FROM rate_limits
WHERE window_start > now() - interval '1 hour'
GROUP BY endpoint
ORDER BY violations DESC;
```

Set alert if violations > 10/hour for any endpoint.

## 10. Health Check Endpoint

Create a health check endpoint to monitor system status:

```typescript
// src/api/health.ts
export async function healthCheck() {
  const checks = {
    database: false,
    storage: false,
    timestamp: new Date().toISOString(),
  };

  try {
    // Check database
    const { error: dbError } = await supabase
      .from('facilities')
      .select('id')
      .limit(1);
    checks.database = !dbError;

    // Check storage
    const { error: storageError } = await supabase
      .storage
      .getBucket('court-images');
    checks.storage = !storageError;

    const allHealthy = checks.database && checks.storage;

    return {
      status: allHealthy ? 'healthy' : 'degraded',
      checks,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      checks,
      error: error.message,
    };
  }
}
```

## 11. Monitoring Checklist

Daily:
- [ ] Check Sentry for new errors
- [ ] Review slow query log in Supabase
- [ ] Check uptime monitoring status

Weekly:
- [ ] Review performance trends
- [ ] Check rate limit violations
- [ ] Review alert noise and adjust thresholds
- [ ] Check database growth and projections

Monthly:
- [ ] Review and optimize expensive queries
- [ ] Audit alert coverage
- [ ] Review incident response times
- [ ] Update runbooks based on incidents

## 12. Incident Response Runbook

When an alert fires:

1. **Acknowledge** - Acknowledge alert in monitoring system
2. **Assess** - Check Sentry, logs, and metrics to understand impact
3. **Communicate** - Update status page if user-facing
4. **Mitigate** - Take immediate action to restore service
5. **Resolve** - Fix root cause
6. **Document** - Create incident report
7. **Review** - Post-mortem to prevent recurrence

## Summary

With this monitoring setup, you'll have:
- Real-time error tracking
- Performance insights
- Uptime monitoring
- Custom business metrics
- Proactive alerting
- Incident response capability

This provides the visibility needed to run PaddleGrid at scale confidently.
