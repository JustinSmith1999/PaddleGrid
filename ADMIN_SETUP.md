# Admin Panel Access Guide

## How to Access the Admin Panel

The admin panel is visible in the navigation bar only for users with admin privileges.

### Step 1: Create an Account
1. Click "Sign In" in the top navigation
2. Click "Sign Up" tab
3. Create your account with email and password

### Step 2: Grant Admin Access

You need to manually promote your user to admin role in the Supabase database.

#### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Select your project: `husbupeealwuxyopfwwb`
3. Go to **Table Editor** in the left sidebar
4. Click on the **profiles** table
5. Find your user row (search by email)
6. Click on the row to edit
7. Change the `role` field from `user` to `admin`
8. Save the changes
9. Refresh your PaddleGrid page

#### Option B: Using SQL Editor

1. Go to your Supabase project dashboard
2. Open **SQL Editor** from the left sidebar
3. Run this SQL command (replace with your email):

```sql
UPDATE profiles
SET role = 'admin'
WHERE email = 'your-email@example.com';
```

4. Refresh your PaddleGrid page

### Step 3: Access Admin Features

Once you have admin role:

1. **Admin Button** will appear in the navigation bar (purple button with shield icon)
2. Click it to access the Admin Panel
3. You'll see tabs for:
   - **Dashboard**: Quick overview of your facility
   - **Analytics**: Revenue tracking, user metrics, performance insights
   - **Courts**: Add, edit, and manage courts
   - **Bookings**: View and manage all bookings
   - **Events**: Create and manage tournaments, clinics, leagues
   - **Users**: View and manage all registered users

## Admin Panel Features

### Analytics Dashboard
- Total revenue tracking
- Booking statistics
- User growth metrics
- Active memberships count
- Today's activity overview
- Most popular court analysis

### Court Management
- Add new courts with pricing
- Upload court images
- Set court descriptions and amenities
- Enable/disable courts
- Edit hourly rates

### Booking Management
- View all bookings across all courts
- Filter by status (pending, confirmed, cancelled)
- Update booking details
- Cancel bookings
- Track payment status

### Event Management
- Create tournaments, clinics, social events, leagues
- Set capacity and pricing (member/non-member)
- Publish/unpublish events
- Track registrations
- Monitor participant count

### User Management
- View all registered users
- See user statistics
- Monitor membership status
- Track user activity

## Security Notes

- Only users with `role = 'admin'` in the profiles table can access admin features
- Row-level security policies prevent non-admin users from accessing admin data
- All admin actions are performed with proper authentication
- Regular users cannot see or access admin functionality

## Need Help?

If you're unable to access the admin panel:

1. Verify you're signed in to the correct account
2. Confirm your role is set to 'admin' in the profiles table
3. Clear browser cache and refresh
4. Sign out and sign back in to refresh your session

## Default Setup

By default:
- All new users are created with `role = 'user'`
- You must manually promote at least one user to admin
- The first admin user can then manage the platform
- Consider keeping admin access limited to trusted facility staff
