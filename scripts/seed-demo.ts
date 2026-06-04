/**
 * PaddleGrid Demo Seed Script
 *
 * Creates 200+ realistic fake users with full social activity, bookings,
 * messages, achievements, and analytics data. Designed to make PaddleGrid
 * look like a thriving, active platform for investor demos.
 *
 * Usage:
 *   npx tsx scripts/seed-demo.ts
 *
 * Required environment variables:
 *   SUPABASE_URL - Your Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY - Service role key (NOT anon key)
 *
 * Creates two demo accounts:
 *   demo-admin@paddlegrid.com / DemoAdmin2024!
 *   demo-player@paddlegrid.com / DemoPlayer2024!
 */

import { createClient } from '@supabase/supabase-js';

// --- CONFIG ---
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing environment variables!');
  console.error('   Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  console.error('   Example: SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=eyJ... npx tsx scripts/seed-demo.ts');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// --- REALISTIC DATA ---
const FIRST_NAMES = [
  'James', 'Michael', 'Robert', 'David', 'William', 'John', 'Richard', 'Thomas', 'Christopher', 'Daniel',
  'Matthew', 'Anthony', 'Mark', 'Steven', 'Andrew', 'Joseph', 'Charles', 'Brian', 'Kevin', 'Jason',
  'Sarah', 'Jennifer', 'Lisa', 'Jessica', 'Amanda', 'Emily', 'Michelle', 'Ashley', 'Melissa', 'Stephanie',
  'Nicole', 'Elizabeth', 'Heather', 'Lauren', 'Rachel', 'Samantha', 'Katherine', 'Rebecca', 'Maria', 'Christina',
  'Carlos', 'Miguel', 'Diego', 'Pablo', 'Roberto', 'Sofia', 'Isabella', 'Valentina', 'Camila', 'Elena',
  'Raj', 'Priya', 'Arun', 'Deepa', 'Vikram', 'Ananya', 'Sanjay', 'Meera', 'Arjun', 'Kavita',
  'Brandon', 'Tyler', 'Austin', 'Dylan', 'Ethan', 'Olivia', 'Emma', 'Ava', 'Sophia', 'Mia',
  'Alexander', 'Benjamin', 'Lucas', 'Henry', 'Owen', 'Grace', 'Chloe', 'Lily', 'Zoe', 'Nora',
  'Marcus', 'Darnell', 'Tyrone', 'Jamal', 'Andre', 'Keisha', 'Tamika', 'Jasmine', 'Aaliyah', 'Imani',
  'Connor', 'Patrick', 'Sean', 'Ryan', 'Brendan', 'Sienna', 'Fiona', 'Ciara', 'Aoife', 'Niamh',
  'Hiroshi', 'Yuki', 'Kenji', 'Sakura', 'Takeshi', 'Wei', 'Lin', 'Chen', 'Mei', 'Jun',
  'Pierre', 'Jean', 'Marie', 'Sophie', 'Isabelle', 'Klaus', 'Hans', 'Anna', 'Greta', 'Lena',
  'Liam', 'Noah', 'Oliver', 'Elijah', 'Mason', 'Charlotte', 'Amelia', 'Harper', 'Evelyn', 'Abigail',
  'Jake', 'Cole', 'Hunter', 'Wyatt', 'Carter', 'Madeline', 'Violet', 'Stella', 'Hazel', 'Aurora',
  'Nathan', 'Caleb', 'Isaac', 'Eli', 'Adrian', 'Penelope', 'Riley', 'Layla', 'Natalie', 'Lucy',
  'Jordan', 'Cameron', 'Alex', 'Taylor', 'Morgan', 'Casey', 'Avery', 'Quinn', 'Reese', 'Blake',
  'Derek', 'Travis', 'Chad', 'Brett', 'Todd', 'Tiffany', 'Britney', 'Amber', 'Crystal', 'Brooke',
  'Greg', 'Scott', 'Jeff', 'Mike', 'Tim', 'Karen', 'Susan', 'Linda', 'Barbara', 'Patricia',
  'Tony', 'Frank', 'George', 'Ray', 'Larry', 'Donna', 'Carol', 'Sandra', 'Sharon', 'Diane',
  'Pete', 'Steve', 'Dan', 'Phil', 'Rick', 'Nancy', 'Betty', 'Helen', 'Dorothy', 'Ruth'
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
  'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts',
  'Patel', 'Kumar', 'Singh', 'Shah', 'Sharma', "O'Brien", 'Murphy', 'Sullivan', 'Kelly', 'Walsh',
  'Chen', 'Kim', 'Park', 'Tanaka', 'Nakamura', 'Mueller', 'Schmidt', 'Weber', 'Fischer', 'Wagner',
  'Dubois', 'Martin', 'Bernard', 'Robert', 'Petit', 'Costa', 'Ferreira', 'Santos', 'Oliveira', 'Silva',
  'Brennan', "O'Connor", 'Fitzgerald', 'Doyle', 'Ryan', 'Parker', 'Evans', 'Stewart', 'Morris', 'Reed',
  'Cook', 'Morgan', 'Bell', 'Murphy', 'Bailey', 'Rivera', 'Cooper', 'Richardson', 'Cox', 'Howard'
];

const BIOS = [
  'Pickleball addict. 4.0 player looking for competitive games.',
  'Just started playing paddle 6 months ago and I\'m hooked!',
  'Former tennis player who discovered the joy of pickleball.',
  'Weekend warrior. Love doubles matches!',
  'Retired and spending my mornings on the court.',
  'Competitive player training for tournaments.',
  'Playing for fitness and fun. Always up for a game!',
  'DUPR 4.5 | Looking for advanced partners',
  'Morning player, usually at the courts by 6am.',
  'New to the area, looking for a regular group.',
  'Teaching my kids to play. Family doubles every Sunday!',
  'League player | Captain of The Dinking Dead',
  'Love a good kitchen battle. No bangers please!',
  'Part-time coach, full-time enthusiast.',
  'Played racquetball for 20 years, switched to paddle last year.',
  'Social player looking for evening games after work.',
  'Training for the senior nationals. 60+ category.',
  'Just moved here from Austin. Missing my old crew!',
  'Doubles specialist. Great communication on the court.',
  'I bring snacks. You bring your A-game.',
  'Daily player. Rain or shine (indoor courts FTW!).',
  'Strategy over power. Let\'s play smart.',
  'Recovering from knee surgery, getting back in the game!',
  'Three sport athlete: paddle, tennis, and pickleball.',
  'Here for the community as much as the competition.',
  '',
  '',
  '',
];

const POST_BODIES = [
  'Great session today! Three games, two wins. The courts were in perfect shape.',
  'Who else is playing this Saturday morning? Looking for a doubles partner!',
  'Just hit my first ace in a competitive match! Still buzzing from it',
  'Shoutout to the staff for fixing Court 3 so quickly. Plays like new!',
  'New paddle day! Testing out the Selkirk Vanguard Power Air. Review coming soon.',
  'Pulled off a behind-the-back shot that I\'ll never replicate in a million years',
  'Love the new court lighting! Evening sessions just got so much better.',
  'Tournament next month - anyone want to partner up? 4.0+ preferred.',
  'My 10-year-old beat me today. Not sure if I should be proud or embarrassed.',
  'Perfect morning for some paddle. 65 degrees, no wind, great company.',
  'Been playing for 6 months and just broke 4.0 DUPR! Hard work pays off.',
  'Tips for improving my backhand? It\'s my weakest shot by far.',
  'The Wednesday night social is honestly the best thing about this club.',
  'Post-game smoothie hits different after a 3-set battle. What a match!',
  'Congrats to the Thursday night league winners! Well deserved.',
  'Anyone have recommendations for paddle tennis shoes? My current ones are shot.',
  'Brought a friend who\'d never played before - they\'re already hooked!',
  'That feeling when you finally figure out the third shot drop... chef\'s kiss.',
  'Court etiquette reminder: please pick up your balls after each game!',
  'Signed up for my first tournament! Nervous but excited. Any advice?',
  'Beautiful sunset game tonight. This is why I play.',
  'Looking to organize a round-robin this weekend. DM if interested!',
  'New personal record: 5 straight wins without dropping a game!',
  'The community here is what keeps me coming back. Love this place.',
  'Recovery day today. Ice bath and stretching after yesterday\'s marathon session.',
  'Just completed my 100th booking on PaddleGrid! This app tracks everything.',
  'Paddle tennis > regular tennis. Fight me.',
  'Teaching beginners is so rewarding. Seeing their first rally is magical.',
  'Weekend warrior reporting for duty. Who needs a fourth for doubles?',
  'That moment when the dink rally goes 30+ shots... pure adrenaline!',
  'Upgraded to a carbon fiber paddle. The control difference is unreal.',
  'Rain delay turned into a great hangout at the clubhouse. Silver linings!',
  'My serve has improved 200% since I started recording myself. Game changer.',
  'Happy birthday to my doubles partner! 15 years playing together.',
  'Evening lights + great opponents = perfect Thursday night.',
  'Can we appreciate how good the scheduling system is? No more group text chaos.',
  'First time playing on the new Court 6 - those pickleball lines are perfect',
  'Down 8-2 in the final game. Came back to win 11-9. Never give up!',
  'The 6am crew is the best crew. Early birds get the open courts!',
  'Grateful for this community. Moved here knowing nobody and now I have 50+ paddle friends.',
];

const COMMENT_BODIES = [
  'Great job!', 'Congrats!', 'That\'s awesome!', 'Way to go!',
  'I\'m in! DM me the details.', 'Count me in for Saturday!',
  'Nice shot! I saw that one', 'Impressive!', 'Keep it up!',
  'Love this community!', 'So true!', 'Agreed 100%',
  'I need to get back out there...', 'Same here!', 'Let\'s run it back!',
  'You\'re on fire lately!', 'Beast mode!', 'Inspiring!',
  'Haha so relatable', 'This is the way', 'Facts!',
  'See you out there tomorrow!', 'Good luck in the tournament!',
  'Following this thread', 'Thanks for sharing!', 'Love the energy!',
  'Your backhand is looking good from what I\'ve seen!',
  'I use the HEAD Motion shoes - highly recommend!',
  'The Engage Pursuit MX is also great for the price.',
  'Let me know if you need tips - happy to rally with you.',
  'Wednesday nights are legendary!', 'Count me in next time!',
];

const MESSAGE_THREADS = [
  ['Hey! Want to play doubles this Saturday?', 'Absolutely! What time works?', 'How about 9am? Court 2?', 'Perfect. I\'ll book it!', 'See you there!'],
  ['Great game today! You\'ve really improved your serve.', 'Thanks! Been practicing the toss. Still shaky under pressure though.', 'It looked solid to me. Same time next week?', 'Definitely!'],
  ['Are you signed up for the tournament next month?', 'Not yet, still looking for a partner. You interested?', 'Actually yes! I was going to ask you the same thing', 'Let\'s do it! I\'ll register us.', 'Amazing. Let me know if you need anything from me.', 'Just be ready to crush it'],
  ['Do you have an extra paddle I could borrow? Mine cracked.', 'Oh no! Yeah I have a spare Selkirk you can use.', 'You\'re a lifesaver. I\'ll grab it before our game tomorrow.', 'No problem! It\'s in my bag - remind me if I forget.'],
  ['That last game was brutal lol', 'I know! 11-9 in the third?? My legs are still shaking.', 'Best match I\'ve played in months though', 'Same. Rematch next week? I want revenge', 'You\'re on!'],
  ['Welcome to the club! Let me know if you need anything.', 'Thanks so much! Everyone has been so welcoming.', 'That\'s what we\'re about. Are you playing the Wednesday social?', 'Planning on it! See you there.'],
  ['Can you cover my league slot Thursday? Something came up.', 'What time?', '7pm, Court 4. It\'s against the Lobsters.', 'I can make that work. Good luck with whatever came up!', 'Thank you!! I owe you one.'],
  ['Hey your form looked really good today', 'Oh thanks! I\'ve been watching a lot of YouTube tutorials haha', 'Whatever you\'re doing keep doing it. That cross-court was nasty.', 'Appreciate that! Still so much to learn though.'],
];

const ACHIEVEMENT_CATALOG = [
  { id: 'first_booking', name: 'First Step', description: 'Made your first court booking', icon_url: null, points: 10 },
  { id: 'five_bookings', name: 'Regular', description: 'Booked 5 court sessions', icon_url: null, points: 25 },
  { id: 'twenty_bookings', name: 'Committed', description: 'Booked 20 court sessions', icon_url: null, points: 50 },
  { id: 'fifty_bookings', name: 'Court Warrior', description: 'Booked 50 court sessions', icon_url: null, points: 100 },
  { id: 'first_win', name: 'Winner', description: 'Won your first match', icon_url: null, points: 15 },
  { id: 'streak_3', name: 'Hot Streak', description: 'Won 3 matches in a row', icon_url: null, points: 30 },
  { id: 'streak_5', name: 'On Fire', description: 'Won 5 matches in a row', icon_url: null, points: 50 },
  { id: 'streak_10', name: 'Unstoppable', description: 'Won 10 matches in a row', icon_url: null, points: 100 },
  { id: 'social_butterfly', name: 'Social Butterfly', description: 'Made 10 posts in the community', icon_url: null, points: 20 },
  { id: 'first_post', name: 'Hello World', description: 'Made your first community post', icon_url: null, points: 5 },
  { id: 'early_bird', name: 'Early Bird', description: 'Played before 7am', icon_url: null, points: 15 },
  { id: 'night_owl', name: 'Night Owl', description: 'Played after 9pm', icon_url: null, points: 15 },
  { id: 'century_club', name: 'Century Club', description: 'Played 100 matches', icon_url: null, points: 200 },
  { id: 'tournament_entry', name: 'Competitor', description: 'Entered your first tournament', icon_url: null, points: 25 },
  { id: 'all_courts', name: 'Explorer', description: 'Played on every court at the facility', icon_url: null, points: 30 },
];

// --- HELPERS ---
function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(startDaysAgo: number, endDaysAgo: number): Date {
  const now = new Date();
  const start = new Date(now.getTime() - startDaysAgo * 24 * 60 * 60 * 1000);
  const end = new Date(now.getTime() - endDaysAgo * 24 * 60 * 60 * 1000);
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function formatTime(hour: number, minute: number = 0): string {
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
}

function generateEmail(first: string, last: string, index: number): string {
  const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'icloud.com', 'hotmail.com', 'protonmail.com'];
  const cleanFirst = first.toLowerCase().replace(/[^a-z]/g, '');
  const cleanLast = last.toLowerCase().replace(/[^a-z]/g, '');
  const suffix = index > 50 ? index.toString() : '';
  return `${cleanFirst}.${cleanLast}${suffix}@${randomFrom(domains)}`;
}

function generateAvatarUrl(name: string): string {
  const encoded = encodeURIComponent(name);
  const colors = ['0D9488', '059669', '0891B2', '7C3AED', 'DC2626', 'D97706', '2563EB', 'DB2777'];
  const bg = randomFrom(colors);
  return `https://ui-avatars.com/api/?name=${encoded}&background=${bg}&color=fff&size=200&bold=true&format=svg`;
}

// --- MAIN SEED FUNCTION ---
async function seedDemo() {
  console.log('PaddleGrid Demo Seed Script');
  console.log('================================\n');

  console.log('Finding facility and courts...');
  const { data: facilities } = await supabase.from('facilities').select('id, name, slug').limit(1);
  let facilityId: string;

  if (facilities && facilities.length > 0) {
    facilityId = facilities[0].id;
    console.log(`   Found facility: ${facilities[0].name} (${facilityId})`);
  } else {
    const { data: newFacility, error } = await supabase.from('facilities').insert({
      name: 'PaddleGrid Demo Club',
      slug: 'paddlegrid-demo',
      description: 'A premier paddle sports facility with 9 courts, pro shop, and vibrant community.',
      city: 'Austin',
      state: 'TX',
      postal_code: '78701',
      country: 'US',
      timezone: 'America/Chicago',
      phone: '(512) 555-0100',
      email: 'info@paddlegriddemo.com',
    }).select().single();
    if (error) throw new Error(`Failed to create facility: ${error.message}`);
    facilityId = newFacility!.id;
    console.log(`   Created facility: PaddleGrid Demo Club (${facilityId})`);
  }

  const { data: courts } = await supabase.from('courts').select('id, name, hourly_rate').eq('facility_id', facilityId);
  if (!courts || courts.length === 0) {
    throw new Error('No courts found for facility. Please create courts first.');
  }
  console.log(`   Found ${courts.length} courts\n`);

  console.log('Creating 200+ demo users...');
  const userIds: string[] = [];
  const userProfiles: { id: string; name: string; email: string }[] = [];
  const usedEmails = new Set<string>();

  const demoAccounts = [
    { email: 'demo-admin@paddlegrid.com', password: 'DemoAdmin2024!', name: 'Alex Rivera', role: 'owner' as const },
    { email: 'demo-player@paddlegrid.com', password: 'DemoPlayer2024!', name: 'Jordan Chen', role: 'user' as const },
  ];

  for (const demo of demoAccounts) {
    const { data: existing } = await supabase.from('profiles').select('id').eq('email', demo.email).maybeSingle();
    if (existing) {
      userIds.push(existing.id);
      userProfiles.push({ id: existing.id, name: demo.name, email: demo.email });
      console.log(`   Demo account exists: ${demo.email}`);
      continue;
    }

    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: demo.email, password: demo.password, email_confirm: true,
      user_metadata: { full_name: demo.name },
    });

    if (authError) { console.error(`   Failed to create ${demo.email}: ${authError.message}`); continue; }

    const userId = authUser.user.id;
    userIds.push(userId);
    userProfiles.push({ id: userId, name: demo.name, email: demo.email });

    await supabase.from('profiles').upsert({ id: userId, email: demo.email, full_name: demo.name, phone: '(512) 555-0001', role: demo.role, profile_picture_url: generateAvatarUrl(demo.name) });

    if (demo.role === 'owner') {
      await supabase.from('facility_members').upsert({ facility_id: facilityId, user_id: userId, role: 'owner' }, { onConflict: 'facility_id,user_id' });
    }
    console.log(`   Created: ${demo.email} (${demo.role})`);
  }

  const TARGET_USERS = 210;
  let created = 0;
  let skipped = 0;

  for (let i = 0; i < TARGET_USERS; i++) {
    const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
    const lastName = LAST_NAMES[i % LAST_NAMES.length];
    const fullName = `${firstName} ${lastName}`;
    const email = generateEmail(firstName, lastName, i);

    if (usedEmails.has(email)) continue;
    usedEmails.add(email);

    const { data: existing } = await supabase.from('profiles').select('id').eq('email', email).maybeSingle();
    if (existing) { userIds.push(existing.id); userProfiles.push({ id: existing.id, name: fullName, email }); skipped++; continue; }

    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({ email, password: 'DemoUser2024!', email_confirm: true, user_metadata: { full_name: fullName } });
    if (authError) { skipped++; continue; }

    const userId = authUser.user.id;
    userIds.push(userId);
    userProfiles.push({ id: userId, name: fullName, email });

    await supabase.from('profiles').upsert({ id: userId, email, full_name: fullName, phone: Math.random() > 0.3 ? `(${randomBetween(200, 999)}) ${randomBetween(200, 999)}-${randomBetween(1000, 9999)}` : null, role: 'user', profile_picture_url: Math.random() > 0.15 ? generateAvatarUrl(fullName) : null });

    created++;
    if (created % 25 === 0) console.log(`   ... ${created} users created`);
  }

  console.log(`   ${created} new users created, ${skipped} already existed`);
  console.log(`   Total user pool: ${userIds.length}\n`);

  console.log('Building social graph (follows)...');
  const followPairs: { follower_id: string; followed_id: string }[] = [];
  for (const userId of userIds) {
    const numFollows = randomBetween(5, 30);
    const candidates = userIds.filter(id => id !== userId);
    const shuffled = candidates.sort(() => Math.random() - 0.5).slice(0, numFollows);
    for (const followedId of shuffled) { followPairs.push({ follower_id: userId, followed_id: followedId }); }
  }
  for (let i = 0; i < followPairs.length; i += 500) {
    const batch = followPairs.slice(i, i + 500);
    await supabase.from('follows').upsert(batch, { onConflict: 'follower_id,followed_id', ignoreDuplicates: true });
  }
  console.log(`   ${followPairs.length} follow relationships created\n`);

  console.log('Generating 8 weeks of booking history...');
  const bookingInserts: any[] = [];
  const blockInserts: any[] = [];

  for (let daysAgo = 56; daysAgo >= 0; daysAgo--) {
    const date = new Date(); date.setDate(date.getDate() - daysAgo);
    const dateStr = formatDate(date);
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const baseBookings = isWeekend ? randomBetween(25, 45) : randomBetween(12, 30);
    const growthMultiplier = 1 + (56 - daysAgo) / 56 * 0.4;
    const numBookings = Math.round(baseBookings * growthMultiplier);

    for (let b = 0; b < numBookings; b++) {
      const court = randomFrom(courts);
      const userId = randomFrom(userIds);
      let hour: number;
      const roll = Math.random();
      if (roll < 0.15) hour = randomBetween(6, 7);
      else if (roll < 0.45) hour = randomBetween(8, 11);
      else if (roll < 0.55) hour = randomBetween(12, 15);
      else if (roll < 0.85) hour = randomBetween(16, 19);
      else hour = randomBetween(20, 21);

      const duration = Math.random() > 0.3 ? 1 : 1.5;
      const endHour = hour + duration;

      bookingInserts.push({ court_id: court.id, user_id: userId, booking_date: dateStr, start_time: formatTime(hour), end_time: formatTime(Math.floor(endHour), (endHour % 1) * 60), status: daysAgo > 0 ? 'confirmed' : (Math.random() > 0.1 ? 'confirmed' : 'pending'), notes: Math.random() > 0.7 ? randomFrom(['Doubles match', 'Practice session', 'League game', 'Social play', 'Coaching session']) : null, created_at: new Date(date.getTime() - randomBetween(1, 7) * 24 * 60 * 60 * 1000).toISOString() });
      blockInserts.push({ facility_id: facilityId, court_id: court.id, block_date: dateStr, start_time: formatTime(hour), end_time: formatTime(Math.floor(endHour), (endHour % 1) * 60), block_type: 'reservation', notes: userProfiles.find(u => u.id === userId)?.name || 'Reserved', player_count: Math.random() > 0.5 ? randomBetween(2, 4) : null });
    }
  }

  let bookingsCreated = 0;
  for (let i = 0; i < bookingInserts.length; i += 200) {
    const batch = bookingInserts.slice(i, i + 200);
    const { error } = await supabase.from('bookings').insert(batch);
    if (!error) bookingsCreated += batch.length;
  }
  console.log(`   ${bookingsCreated} bookings created`);

  let blocksCreated = 0;
  for (let i = 0; i < blockInserts.length; i += 200) {
    const batch = blockInserts.slice(i, i + 200);
    const { error } = await supabase.from('court_availability_blocks').insert(batch);
    if (!error) blocksCreated += batch.length;
  }
  console.log(`   ${blocksCreated} availability blocks created\n`);

  console.log('Generating player stats...');
  const statsInserts: any[] = [];
  for (const userId of userIds) {
    const played = randomBetween(5, 80);
    const won = Math.round(played * (0.3 + Math.random() * 0.4));
    const streak = Math.random() > 0.7 ? randomBetween(1, 8) : 0;
    const dupr = (2.5 + Math.random() * 3).toFixed(2);
    const skillLevel = parseFloat(dupr) < 3.0 ? 'beginner' : parseFloat(dupr) < 4.0 ? 'intermediate' : parseFloat(dupr) < 5.0 ? 'advanced' : 'pro';
    statsInserts.push({ user_id: userId, matches_played: played, matches_won: won, matches_lost: played - won, current_win_streak: streak, longest_win_streak: Math.max(streak, randomBetween(2, 12)), dupr, skill_level: skillLevel });
  }
  for (let i = 0; i < statsInserts.length; i += 100) { await supabase.from('player_stats').upsert(statsInserts.slice(i, i + 100), { onConflict: 'user_id' }); }
  console.log(`   ${statsInserts.length} player stats records created\n`);

  console.log('Setting up achievements...');
  await supabase.from('achievements').upsert(ACHIEVEMENT_CATALOG, { onConflict: 'id' });
  const achievementInserts: any[] = [];
  for (const userId of userIds) {
    const numAch = randomBetween(2, 10);
    const shuffled = [...ACHIEVEMENT_CATALOG].sort(() => Math.random() - 0.5).slice(0, numAch);
    for (const ach of shuffled) { achievementInserts.push({ user_id: userId, achievement_id: ach.id, unlocked_at: randomDate(60, 1).toISOString() }); }
  }
  for (let i = 0; i < achievementInserts.length; i += 200) { await supabase.from('user_achievements').upsert(achievementInserts.slice(i, i + 200), { onConflict: 'user_id,achievement_id', ignoreDuplicates: true }); }
  console.log(`   ${achievementInserts.length} achievements awarded\n`);

  console.log('Generating social feed...');
  const postIds: string[] = [];
  for (let i = 0; i < 60; i++) {
    const authorId = randomFrom(userIds);
    const kind = Math.random() > 0.2 ? 'text' : (Math.random() > 0.5 ? 'booking_share' : 'achievement');
    const { data: post } = await supabase.from('posts').insert({ author_id: authorId, kind, body: randomFrom(POST_BODIES), facility_id: Math.random() > 0.3 ? facilityId : null, visibility: 'public', like_count: 0, comment_count: 0, created_at: randomDate(45, 0).toISOString() }).select('id').single();
    if (post) postIds.push(post.id);
  }
  console.log(`   ${postIds.length} posts created`);

  let totalLikes = 0;
  for (const postId of postIds) {
    const numLikes = randomBetween(2, 25);
    const likers = userIds.sort(() => Math.random() - 0.5).slice(0, numLikes);
    await supabase.from('post_likes').upsert(likers.map(uid => ({ post_id: postId, user_id: uid, created_at: randomDate(30, 0).toISOString() })), { onConflict: 'post_id,user_id', ignoreDuplicates: true });
    await supabase.from('posts').update({ like_count: numLikes }).eq('id', postId);
    totalLikes += numLikes;
  }
  console.log(`   ${totalLikes} likes added`);

  let totalComments = 0;
  for (const postId of postIds) {
    const numComments = randomBetween(0, 8);
    for (let c = 0; c < numComments; c++) { await supabase.from('comments').insert({ post_id: postId, author_id: randomFrom(userIds), body: randomFrom(COMMENT_BODIES), created_at: randomDate(30, 0).toISOString() }); totalComments++; }
    await supabase.from('posts').update({ comment_count: numComments }).eq('id', postId);
  }
  console.log(`   ${totalComments} comments added\n`);

  console.log('Creating message threads...');
  let totalMessages = 0;
  for (let i = 0; i < 40; i++) {
    const shuffled = userIds.sort(() => Math.random() - 0.5);
    const [user1, user2] = [shuffled[0], shuffled[1]];
    const { data: convo } = await supabase.from('conversations').insert({ created_at: randomDate(30, 0).toISOString(), last_message_at: randomDate(5, 0).toISOString() }).select('id').single();
    if (!convo) continue;
    await supabase.from('conversation_members').insert([{ conversation_id: convo.id, user_id: user1 }, { conversation_id: convo.id, user_id: user2 }]);
    const thread = randomFrom(MESSAGE_THREADS);
    for (let m = 0; m < thread.length; m++) {
      const msgDate = randomDate(14, 0); msgDate.setMinutes(msgDate.getMinutes() + m * randomBetween(2, 30));
      await supabase.from('messages').insert({ conversation_id: convo.id, sender_id: m % 2 === 0 ? user1 : user2, body: thread[m], created_at: msgDate.toISOString() });
      totalMessages++;
    }
  }
  console.log(`   40 conversations, ${totalMessages} messages\n`);

  console.log('Generating match history...');
  let matchesCreated = 0;
  for (let i = 0; i < 150; i++) {
    const shuffled = userIds.sort(() => Math.random() - 0.5);
    const format = Math.random() > 0.4 ? 'doubles' : 'singles';
    const numPlayers = format === 'doubles' ? 4 : 2;
    const players = shuffled.slice(0, numPlayers);
    const playedAt = randomDate(56, 1);
    const scores = [];
    const numSets = Math.random() > 0.3 ? 2 : 3;
    let teamAWins = 0, teamBWins = 0;
    for (let s = 0; s < numSets; s++) {
      const winner = Math.random() > 0.5 ? 'a' : 'b';
      scores.push(winner === 'a' ? [11, randomBetween(4, 9)] : [randomBetween(4, 9), 11]);
      if (winner === 'a') teamAWins++; else teamBWins++;
    }
    const overallWinner = teamAWins > teamBWins ? 'team_a' : 'team_b';
    const { data: match } = await supabase.from('matches').insert({ facility_id: facilityId, court_id: randomFrom(courts).id, format, played_at: playedAt.toISOString(), duration_minutes: randomBetween(30, 75), score: { sets: scores, winner: overallWinner }, is_verified: Math.random() > 0.3, created_by: players[0], created_at: playedAt.toISOString() }).select('id').single();
    if (!match) continue;
    await supabase.from('match_participants').insert(players.map((uid, idx) => ({ match_id: match.id, user_id: uid, team: idx < numPlayers / 2 ? 'a' : 'b', is_winner: idx < numPlayers / 2 ? overallWinner === 'team_a' : overallWinner === 'team_b', confirmed: Math.random() > 0.2 })));
    matchesCreated++;
  }
  console.log(`   ${matchesCreated} matches with full results\n`);

  console.log('Creating notifications for demo accounts...');
  const notifTypes = [
    { kind: 'new_follower', title: 'New Follower', body: ' started following you' },
    { kind: 'post_like', title: 'Post Liked', body: ' liked your post' },
    { kind: 'post_comment', title: 'New Comment', body: ' commented on your post' },
    { kind: 'booking_confirmed', title: 'Booking Confirmed', body: 'Your court booking has been confirmed' },
    { kind: 'achievement_unlocked', title: 'Achievement Unlocked!', body: 'You earned a new badge!' },
    { kind: 'dm_received', title: 'New Message', body: ' sent you a message' },
  ];
  for (const demoUserId of userIds.slice(0, 2)) {
    for (let n = 0; n < 15; n++) {
      const nt = randomFrom(notifTypes);
      const fromUser = randomFrom(userProfiles.filter(u => u.id !== demoUserId));
      await supabase.from('notifications').insert({ user_id: demoUserId, kind: nt.kind, title: nt.title, body: nt.kind === 'booking_confirmed' || nt.kind === 'achievement_unlocked' ? nt.body : `${fromUser.name}${nt.body}`, read_at: n < 5 ? null : randomDate(7, 0).toISOString(), created_at: randomDate(14, 0).toISOString() });
    }
  }
  console.log(`   30 notifications for demo accounts\n`);

  console.log('============================');
  console.log('DEMO SEED COMPLETE!');
  console.log('============================');
  console.log('');
  console.log('Demo Accounts:');
  console.log('  ADMIN:  demo-admin@paddlegrid.com / DemoAdmin2024!');
  console.log('  PLAYER: demo-player@paddlegrid.com / DemoPlayer2024!');
  console.log('');
  console.log('Data Created:');
  console.log(`  ${userIds.length} total users`);
  console.log(`  ${followPairs.length} follow relationships`);
  console.log(`  ${bookingsCreated} bookings (8 weeks history)`);
  console.log(`  ${blocksCreated} court availability blocks`);
  console.log(`  ${statsInserts.length} player stat records`);
  console.log(`  ${achievementInserts.length} achievements awarded`);
  console.log(`  ${postIds.length} social posts`);
  console.log(`  ${totalLikes} post likes`);
  console.log(`  ${totalComments} post comments`);
  console.log(`  40 message conversations (${totalMessages} messages)`);
  console.log(`  ${matchesCreated} matches with scores`);
  console.log('');
  console.log('Ready for investor demo!');
}

seedDemo().catch(err => { console.error('\nSeed failed:', err.message); process.exit(1); });