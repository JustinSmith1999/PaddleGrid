# Stripe Payment Setup Guide

## Overview
Your PaddleGrid platform now includes complete Stripe payment processing with support for bookings, memberships, events, and refunds.

## Required Configuration

### 1. Stripe Account Setup
1. Create a Stripe account at [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register)
2. Complete your business profile in the Stripe Dashboard
3. Enable your account for live payments (when ready)

### 2. Get Your API Keys

#### Test Mode Keys (for development)
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. Copy your **Publishable key** (starts with `pk_test_`)
3. Copy your **Secret key** (starts with `sk_test_`)

#### Live Mode Keys (for production)
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. Copy your **Publishable key** (starts with `pk_live_`)
3. Copy your **Secret key** (starts with `sk_live_`)

### 3. Configure Environment Variables

Add these to your `.env` file:

```bash
# Frontend - Stripe Publishable Key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here

# Backend - These are auto-configured in Supabase
# You need to add them to your Supabase project settings
# Go to: Project Settings > Edge Functions > Secrets
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### 4. Configure Supabase Edge Function Secrets

1. Go to your Supabase project dashboard
2. Navigate to **Project Settings** > **Edge Functions**
3. Add the following secrets:
   - `STRIPE_SECRET_KEY` = Your Stripe secret key
   - `STRIPE_WEBHOOK_SECRET` = Your webhook signing secret (see step 5)

### 5. Set Up Stripe Webhooks

Webhooks allow Stripe to notify your application about payment events.

#### For Development (using Stripe CLI)
1. Install [Stripe CLI](https://stripe.com/docs/stripe-cli)
2. Run: `stripe login`
3. Run: `stripe listen --forward-to https://YOUR_PROJECT.supabase.co/functions/v1/stripe-payments/webhook`
4. Copy the webhook signing secret that starts with `whsec_`
5. Add it to your Supabase Edge Function secrets

#### For Production
1. Go to [Stripe Webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Set endpoint URL to: `https://YOUR_PROJECT.supabase.co/functions/v1/stripe-payments/webhook`
4. Select events to listen for:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
5. Copy the webhook signing secret
6. Add it to your Supabase Edge Function secrets

## Features Implemented

### Payment Processing
- ✅ Secure payment intent creation
- ✅ Stripe Elements integration for card payments
- ✅ Support for all Stripe payment methods
- ✅ Real-time payment status updates
- ✅ Automatic booking confirmation on payment success

### Refund Management
- ✅ Full refunds
- ✅ Partial refunds
- ✅ Multiple refund reasons
- ✅ Automatic booking cancellation on refund
- ✅ Admin-only refund permissions

### Webhook Handling
- ✅ Payment success tracking
- ✅ Payment failure handling
- ✅ Refund event processing
- ✅ Automatic player stats updates
- ✅ Database synchronization

### Financial Analytics
- ✅ Total revenue tracking
- ✅ Monthly Recurring Revenue (MRR)
- ✅ Revenue growth metrics
- ✅ Customer Lifetime Value (LTV)
- ✅ Churn rate calculation
- ✅ Revenue breakdown by source
- ✅ Multi-facility revenue tracking
- ✅ PDF export functionality

## Testing Payments

### Test Card Numbers
Use these test cards in test mode:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0025 0000 3155`

- Use any future expiration date
- Use any 3-digit CVC
- Use any ZIP code

### Testing the Flow
1. Book a court as a user
2. Enter test card details on the payment screen
3. Complete the payment
4. Verify the booking is confirmed
5. As an admin, test refunding the booking

## Multi-Tenant Support with Stripe Connect

PaddleGrid supports multiple clubs/facilities, each with their own Stripe account to receive payments directly. This is achieved using Stripe Connect.

### How It Works

1. **Platform Account**: Your main PaddleGrid Stripe account (the one configured above)
2. **Connected Accounts**: Each club/facility has their own Stripe account connected to the platform
3. **Payment Routing**: When a user pays for a booking or series registration:
   - Payment is processed through your platform account
   - 95% is transferred to the facility's connected Stripe account
   - 5% is kept as a platform fee (configurable in the code)

### Setting Up Stripe Connect

#### 1. Enable Stripe Connect on Your Platform Account

1. Go to [Stripe Connect Settings](https://dashboard.stripe.com/settings/connect)
2. Choose **Standard** or **Express** accounts (recommended: Express for easier onboarding)
3. Configure your Connect settings:
   - Add your brand name
   - Set redirect URIs
   - Configure OAuth settings

#### 2. Connect a Facility's Stripe Account

Each club/facility needs to:

1. Create their own Stripe account at [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register)
2. Complete their business profile
3. Get verified by Stripe (required to receive payouts)

#### 3. Add the Connected Account ID to PaddleGrid

As a platform admin:

1. Go to **Admin Panel** > **Facility Management**
2. Select the facility
3. Add their Stripe Connect Account ID in the `stripe_account_id` field
   - Format: `acct_XXXXXXXXXXXXX`
   - The facility can find this in their Stripe Dashboard > Settings > Account details

#### 4. Alternative: OAuth Connection Flow

For a seamless experience, you can implement Stripe's OAuth flow:

1. Facility clicks "Connect with Stripe" in your admin panel
2. They're redirected to Stripe to authorize the connection
3. Stripe redirects back with the account ID
4. Store this automatically in the `facilities` table

### Payment Flow Example

**Scenario**: User books a court at "North Carolina Pickleball Club" for $50

1. User pays $50 through PaddleGrid
2. Payment processed by your platform Stripe account
3. $47.50 (95%) automatically transferred to NC Pickleball Club's Stripe account
4. $2.50 (5%) retained as platform fee
5. NC Pickleball Club sees $47.50 in their Stripe dashboard
6. They receive payouts directly to their bank account

### Important Notes

- Each facility receives payments directly to their own bank account
- Platform fees are configurable (currently 5%)
- Facilities see their revenue in their own Stripe dashboard
- Refunds are processed from the facility's account
- Each facility can set their own pricing for courts and events
- Tax reporting is handled per facility

## Security Notes

- ✅ Payment processing happens server-side via Edge Functions
- ✅ Never expose your secret key in frontend code
- ✅ Webhook signatures are verified to prevent fraud
- ✅ Row Level Security enforces data isolation
- ✅ Admin-only access to refund functionality

## Support

For Stripe-related issues:
- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Support](https://support.stripe.com/)

For PaddleGrid integration issues:
- Check the browser console for errors
- Verify environment variables are set correctly
- Ensure Edge Function secrets are configured
- Test webhook delivery in Stripe Dashboard
