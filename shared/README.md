# @paddlegrid/shared

Shared API layer and business logic for PaddleGrid web and mobile applications.

## Structure

```
shared/
├── api/              # API modules
│   ├── auth.ts       # Authentication functions
│   ├── social.ts     # Social feed and posts
│   ├── bookings.ts   # Court bookings
│   ├── facilities.ts # Facilities and courts
│   ├── matches.ts    # Match logging
│   └── index.ts      # Exports all API functions
├── config/
│   └── environment.ts # Environment configuration
├── lib/
│   └── supabase.ts   # Supabase client setup
└── types/
    └── index.ts      # TypeScript type definitions
```

## Usage in Web App

```typescript
import { signIn, signOut, getUser } from '../../shared/api';
import { getFeedPosts, createPost } from '../../shared/api';

// Auth
const { error, user } = await signIn(email, password);

// Social
const posts = await getFeedPosts({ type: 'all_local', limit: 20 });
```

## Usage in Mobile App

```typescript
import { signIn, signOut, getUser } from '../shared/api';
import { getFeedPosts, createPost } from '../shared/api';

// Auth
const { error, user } = await signIn(email, password);

// Social
const posts = await getFeedPosts({ type: 'all_local', limit: 20 });
```

## Environment Variables

### Web (.env)
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Mobile (.env)
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## API Modules

### Auth (`api/auth.ts`)
- `signUp()` - Create new user account
- `signIn()` - Sign in with email/password
- `signOut()` - Sign out current user
- `getSession()` - Get current session
- `getUser()` - Get current user
- `getProfile()` - Get user profile
- `updateProfile()` - Update user profile

### Social (`api/social.ts`)
- `createPost()` - Create new post
- `getFeedPosts()` - Get feed posts with filters
- `getPostById()` - Get single post
- `toggleLike()` - Like/unlike post
- `addComment()` - Add comment to post
- `getPostComments()` - Get post comments
- `joinMatch()` - Join match invitation
- `leaveMatch()` - Leave match invitation
- `getNotifications()` - Get user notifications

### Bookings (`api/bookings.ts`)
- `createBooking()` - Create new booking
- `getUserBookings()` - Get user's bookings
- `getBookingById()` - Get single booking
- `cancelBooking()` - Cancel booking
- `getCourtAvailability()` - Get court availability
- `getUpcomingBookings()` - Get upcoming bookings

### Facilities (`api/facilities.ts`)
- `getAllFacilities()` - Get all facilities
- `getFacilityById()` - Get single facility
- `getCourts()` - Get facility courts
- `getCourtById()` - Get single court
- `getUserFacility()` - Get user's facility
- `joinFacility()` - Join facility
- `leaveFacility()` - Leave facility

### Matches (`api/matches.ts`)
- `createMatch()` - Create new match record
- `getUserMatches()` - Get user's matches
- `getMatchById()` - Get single match
- `updateMatchScore()` - Update match scores
- `deleteMatch()` - Delete match

## Benefits of Shared Code

1. **Single Source of Truth** - All API logic in one place
2. **Type Safety** - Shared TypeScript types across platforms
3. **Easy Maintenance** - Fix bugs once, works everywhere
4. **Consistent Behavior** - Same logic on web and mobile
5. **Faster Development** - No need to rewrite API calls
