# Demo Account Setup for Apple Review

## Account Credentials

**Email**: demo@paddlegrid.com
**Password**: DemoPass123!

## Setup Instructions

### Creating the Demo Account

The demo account needs to be created through the normal signup flow to ensure proper auth integration. Follow these steps:

1. **Go to your production app** at https://paddlegrid.com
2. **Click "Sign Up"**
3. **Enter the following details**:
   - Email: demo@paddlegrid.com
   - Password: DemoPass123!
   - First Name: Demo
   - Last Name: User
   - Full Name: Demo User

4. **After account creation, add the demo user to Pickleball Heaven facility**:

```sql
-- Add demo user to Pickleball Heaven facility
-- Replace 'DEMO_USER_ID' with the actual UUID of the demo@paddlegrid.com user
INSERT INTO facility_users (facility_id, user_id, role)
VALUES (
  'bfb8aa81-fca9-48d9-b697-d13bba78430e',  -- Pickleball Heaven
  'DEMO_USER_ID',  -- Get this from profiles table after signup
  'member'
)
ON CONFLICT DO NOTHING;
```

5. **Create sample bookings for the demo account**:

```sql
-- Create upcoming bookings for demo account
INSERT INTO bookings (
  user_id,
  court_id,
  facility_id,
  booking_date,
  start_time,
  end_time,
  duration_hours,
  status,
  payment_status,
  total_amount
)
VALUES
  (
    'DEMO_USER_ID',  -- Replace with actual demo user ID
    'c359066e-3322-466b-b13f-fb4b390eda5b',  -- Court #2
    'bfb8aa81-fca9-48d9-b697-d13bba78430e',  -- Pickleball Heaven
    CURRENT_DATE + interval '3 days',
    '16:00:00'::time,
    '17:30:00'::time,
    1.5,
    'confirmed',
    'paid',
    30.00
  ),
  (
    'DEMO_USER_ID',
    '0152c2a0-c5b9-4302-bd2e-ff34f3ef1de7',  -- Court #3
    'bfb8aa81-fca9-48d9-b697-d13bba78430e',
    CURRENT_DATE + interval '5 days',
    '10:00:00'::time,
    '11:00:00'::time,
    1.0,
    'confirmed',
    'paid',
    25.00
  );
```

6. **Create social posts from demo account**:

```sql
-- Create social posts for demo activity
INSERT INTO social_posts (author_id, facility_id, post_type, content, visibility)
VALUES
  (
    'DEMO_USER_ID',
    'bfb8aa81-fca9-48d9-b697-d13bba78430e',
    'general',
    'Loving the PaddleGrid app! So easy to book courts and connect with other players. 🎾',
    'public'
  );
```

## What's Already Set Up

The demo environment already includes:

✅ **Pickleball Heaven Facility** - A fully configured facility with:
- Multiple courts (Court #2, #3, #4, #5, #7)
- Operating hours set
- Court images and descriptions

✅ **Sample Event Series** - "Beginner Pickleball Clinic"
- Scheduled for evenings (6:00 PM - 7:30 PM)
- $20 per session with 10% series discount
- Available for booking

✅ **Active Community** - Real users and content:
- Multiple user profiles
- Social posts and interactions
- Upcoming bookings from other users

✅ **Fully Functional Features**:
- Court browsing and booking
- Social feed with posts, likes, comments
- Direct messaging between players
- Event/series registration
- Player profiles and stats
- Facility management (for admins)

## Testing the Demo Account

Once created, the demo account can:

1. **Browse Facilities** - View Pickleball Heaven and other facilities
2. **Book Courts** - Make test bookings (use Stripe test mode)
3. **View Bookings** - See upcoming and past bookings
4. **Social Features**:
   - Post to community feed
   - Like and comment on posts
   - Message other players
   - View player profiles
5. **Join Events** - Register for the Beginner Pickleball Clinic
6. **Update Profile** - Edit profile information and upload pictures

## Notes for Apple Reviewers

Include this in your App Review Notes:

```
This is a fully functional test account with access to all player features. The account has:

- Sample bookings at Pickleball Heaven facility
- Access to the community social feed
- Ability to book courts (Stripe test mode enabled)
- Sample event series for registration testing
- Messaging capabilities with other players

To test facility admin features, you can also use:
Email: justin@j20solutions.com
(Note: This account has admin access to demonstrate facility management tools)

The app connects to a live development environment with real-time data updates.
```

## Important Reminders

- ✅ Privacy Policy accessible at: https://paddlegrid.com/privacy
- ✅ Terms of Service accessible at: https://paddlegrid.com/terms
- ✅ Support page accessible at: https://paddlegrid.com/support
- ✅ Stripe payments in test mode for demo
- ✅ All features functional and tested
- ✅ User-generated content moderation in place
