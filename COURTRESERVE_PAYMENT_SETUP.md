# CourtReserve Payment Integration

This document explains how payments are processed through CourtReserve and how to configure the webhook integration.

## Payment Flow

### 1. Booking Creation
When a user creates a booking:
- The booking is sent to CourtReserve's API via the `courtreserve-booking` edge function
- CourtReserve creates the reservation and returns:
  - `booking_id` or `reservation_id`: The CourtReserve booking identifier
  - `payment_url`: A URL where the user completes payment (if payment is required)

### 2. Payment Processing
- If CourtReserve returns a `payment_url`:
  - The booking is created with `status: 'pending'` and `payment_status: 'pending'`
  - User is redirected to CourtReserve's payment page
  - User completes payment on CourtReserve's secure checkout

- If CourtReserve does NOT return a `payment_url`:
  - The booking is automatically confirmed (likely a prepaid or free booking)
  - Booking status is set to `confirmed` with `payment_status: 'paid'`

### 3. Payment Confirmation
After the user completes payment on CourtReserve, there are two ways to confirm:

#### Option A: Webhook (Recommended)
Configure CourtReserve to send a webhook to your system when payment is completed:
- Webhook URL: `https://[your-project].supabase.co/functions/v1/courtreserve-payment-webhook`
- The webhook updates the booking status to `confirmed` and payment status to `paid`

#### Option B: Return URL
Configure CourtReserve to redirect users back to your app after payment:
- Return URL: `https://[your-domain]/bookings?payment_complete=true`
- Your app can then check the booking status or poll CourtReserve's API

## CourtReserve Configuration

### Environment Variables
The following environment variables are automatically configured in Supabase:
- `COURTRESERVE_USERNAME`: Your CourtReserve API username
- `COURTRESERVE_PASSWORD`: Your CourtReserve API password
- `COURTRESERVE_API_URL`: CourtReserve API endpoint (defaults to `https://app.courtreserve.com/Online/API`)

### Webhook Configuration
To enable automatic payment confirmation, configure CourtReserve to send webhooks:

1. Log into your CourtReserve admin panel
2. Navigate to Settings → Integrations → Webhooks
3. Add a new webhook with:
   - **URL**: `https://[your-project].supabase.co/functions/v1/courtreserve-payment-webhook`
   - **Events**: Select `payment.completed`, `booking.confirmed`, or similar payment events
   - **Method**: POST

### Expected Webhook Payload
The webhook should send a JSON payload with:
```json
{
  "event_type": "payment.completed",
  "booking_id": "CR123456",
  "reservation_id": "CR123456",
  "payment_status": "paid",
  "status": "confirmed",
  "amount": 50.00,
  "currency": "USD"
}
```

## Booking Status Flow

### Status Values
- `pending`: Booking created, awaiting payment
- `confirmed`: Booking confirmed, payment completed
- `cancelled`: Booking cancelled by user or admin

### Payment Status Values
- `pending`: Payment not yet completed
- `paid`: Payment successfully processed
- `refunded`: Payment was refunded

## Court Availability

When a booking is created:
1. A record is added to the `bookings` table
2. An availability block is created in `court_availability_blocks` table
3. The court time slot becomes unavailable for other users
4. If payment fails or booking is cancelled, the admin can remove the availability block

## Troubleshooting

### Booking shows "pending" after payment
- Check CourtReserve webhook is configured correctly
- Verify webhook URL is accessible
- Check edge function logs for webhook errors

### Payment URL not being generated
- Verify CourtReserve API credentials are correct
- Check that the court is configured properly in CourtReserve
- Review edge function logs for API errors

### Bookings not syncing to CourtReserve
- Confirm `COURTRESERVE_USERNAME` and `COURTRESERVE_PASSWORD` are set
- Verify CourtReserve API endpoint is correct
- Check court name mapping between your system and CourtReserve

## Testing

### Test Booking Flow
1. Create a booking through your app
2. Verify booking appears in Supabase `bookings` table with `status: 'pending'`
3. Check if `payment_url` is returned
4. Complete payment on CourtReserve (or use test payment if available)
5. Verify webhook is received and booking status updates to `confirmed`

### Test Webhook Manually
Send a POST request to test the webhook:
```bash
curl -X POST https://[your-project].supabase.co/functions/v1/courtreserve-payment-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "booking_id": "test-booking-id",
    "payment_status": "paid",
    "status": "confirmed"
  }'
```

## API Reference

### CourtReserve Booking Endpoint
**URL**: `https://[your-project].supabase.co/functions/v1/courtreserve-booking`

**Method**: POST

**Headers**:
- `Authorization`: Bearer [supabase-anon-key]
- `Content-Type`: application/json

**Request Body**:
```json
{
  "facility_id": "uuid",
  "court_id": "uuid",
  "user_id": "uuid",
  "booking_date": "2024-12-08",
  "start_time": "10:00:00",
  "end_time": "11:00:00",
  "duration_hours": 1,
  "total_amount": 50,
  "user_email": "user@example.com",
  "user_name": "John Doe",
  "user_phone": "+1234567890"
}
```

**Response**:
```json
{
  "success": true,
  "booking": { /* booking object */ },
  "courtreserve_booking_id": "CR123456",
  "payment_url": "https://courtreserve.com/checkout/...",
  "requires_payment": true,
  "courtreserve_synced": true,
  "message": "Booking created. Please complete payment through CourtReserve."
}
```
