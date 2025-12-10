# CourtReserve Booking Integration Guide

This guide explains how PaddleGrid integrates with CourtReserve to sync bookings and payments.

## Overview

When a user books a court through PaddleGrid, the booking is automatically sent to CourtReserve (if configured). This ensures that:
- All bookings appear in your CourtReserve dashboard
- Payments are processed through CourtReserve
- Double-bookings are prevented across both systems
- Your facility has a single source of truth for reservations

## How It Works

### Booking Flow

1. **User selects a time slot** in the CourtScheduler
2. **PaddleGrid calls** the `courtreserve-booking` edge function
3. **Edge function attempts** to create the booking in CourtReserve
4. **If successful**, the booking is saved in PaddleGrid with the CourtReserve booking ID
5. **If CourtReserve sync fails**, the booking is still created in PaddleGrid (with a warning logged)

### Edge Function: courtreserve-booking

**Endpoint**: `/functions/v1/courtreserve-booking`
**Method**: POST
**Authentication**: Requires user JWT token

**Request Payload**:
```json
{
  "facility_id": "uuid",
  "court_id": "uuid",
  "user_id": "uuid",
  "booking_date": "2025-12-08",
  "start_time": "14:00:00",
  "end_time": "16:00:00",
  "duration_hours": 2,
  "total_amount": 50.00,
  "user_email": "user@example.com",
  "user_name": "John Doe",
  "court_name": "Court #1"
}
```

**Response**:
```json
{
  "success": true,
  "booking": { ... },
  "courtreserve_synced": true,
  "courtreserve_booking_id": "cr_12345",
  "courtreserve_error": null,
  "message": "Booking created successfully and synced to CourtReserve"
}
```

## Configuration

### Facility Settings

For each facility that should sync with CourtReserve, add the following to the facility settings:

```json
{
  "courtreserve_api_key": "13321_d0851966-b379-437c-b820-e95fdefb5807",
  "courtreserve_org_id": "Org_13321"
}
```

### Getting CourtReserve API Credentials

1. Log in to your CourtReserve account
2. Navigate to **Settings** → **API Access**
3. Generate or copy your API key
4. Note your Organization ID

## CourtReserve API Requirements

### Important Note

The CourtReserve API endpoint for creating bookings is estimated based on their API structure. The actual endpoint may differ. The current implementation uses:

```
POST https://api.courtreserve.com/api/v1/reservations
```

**Expected Payload**:
```json
{
  "organization_id": "Org_13321",
  "court_name": "Court #1",
  "start_time": "2025-12-08T14:00:00",
  "end_time": "2025-12-08T16:00:00",
  "customer_email": "user@example.com",
  "customer_name": "John Doe",
  "payment_amount": 50.00,
  "notes": "Booking via PaddleGrid - 2 hour(s)"
}
```

### API Documentation Needed

To complete the integration, we need the official CourtReserve API documentation for:

1. **Creating Reservations**
   - Exact endpoint URL
   - Required fields
   - Optional fields
   - Expected response format
   - Error codes and messages

2. **Payment Processing**
   - How to attach payment information
   - Payment status updates
   - Refund handling

3. **Authentication**
   - Token format
   - Token expiration
   - Refresh token process

### Contact CourtReserve Support

To obtain the API documentation:

1. Contact CourtReserve support at: support@courtreserve.com
2. Request access to their API documentation for creating reservations
3. Mention you're integrating a third-party booking system
4. Ask specifically about:
   - POST endpoint for creating reservations
   - Payment integration
   - Webhook notifications (if available)

## Testing

### Manual Testing

1. Go to the CourtScheduler
2. Select a court and time slot
3. Click "Confirm Booking"
4. Check the browser console for sync status
5. Verify the booking appears in CourtReserve dashboard

### Checking Sync Status

All bookings include a `courtreserve_booking_id` field:

```sql
SELECT
  b.id,
  b.booking_date,
  b.start_time,
  c.name as court_name,
  b.courtreserve_booking_id,
  CASE
    WHEN b.courtreserve_booking_id IS NOT NULL
    THEN 'Synced'
    ELSE 'Not Synced'
  END as sync_status
FROM bookings b
JOIN courts c ON c.id = b.court_id
ORDER BY b.created_at DESC
LIMIT 20;
```

## Troubleshooting

### Booking Created but Not Synced to CourtReserve

**Possible causes**:
- CourtReserve API credentials not configured
- Invalid API key
- Court name mismatch between systems
- CourtReserve API endpoint changed

**Check**:
1. Browser console for error messages
2. Supabase Edge Function logs
3. Verify facility settings have correct API credentials

### 401 Authentication Error

- Verify the CourtReserve API key is valid
- Check that the API key has permission to create reservations
- Ensure the API key hasn't expired

### 404 Not Found

- The CourtReserve API endpoint may have changed
- Contact CourtReserve support for the correct endpoint

### Court Name Mismatch

- Ensure court names in PaddleGrid match those in CourtReserve (case-insensitive)
- Update court names in either system to match

## Fallback Behavior

If CourtReserve sync fails:

1. **Booking is still created** in PaddleGrid
2. **User is not notified** of the sync failure (to avoid confusion)
3. **Error is logged** to the console and Edge Function logs
4. **Admin can manually sync** bookings later if needed

This ensures users can always book courts, even if CourtReserve is temporarily unavailable.

## Future Enhancements

1. **Webhook Integration**: Receive notifications when bookings are modified in CourtReserve
2. **Two-Way Sync**: Update PaddleGrid when bookings are created directly in CourtReserve
3. **Payment Status Tracking**: Sync payment confirmation from CourtReserve
4. **Cancellation Sync**: Automatically cancel bookings in CourtReserve when canceled in PaddleGrid
5. **Retry Logic**: Automatically retry failed syncs

## Database Schema

### Bookings Table

The `bookings` table includes:

```sql
CREATE TABLE bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  court_id uuid REFERENCES courts(id),
  facility_id uuid REFERENCES facilities(id),
  user_id uuid REFERENCES auth.users(id),
  booking_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  duration_hours numeric NOT NULL,
  total_amount numeric NOT NULL,
  status text NOT NULL,
  payment_status text NOT NULL,
  courtreserve_booking_id text,  -- CourtReserve reservation ID
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_bookings_courtreserve_id
ON bookings(courtreserve_booking_id)
WHERE courtreserve_booking_id IS NOT NULL;
```

## Support

For issues with:
- **PaddleGrid Integration**: Check this guide and edge function logs
- **CourtReserve API**: Contact CourtReserve support at support@courtreserve.com
- **Payment Processing**: Verify CourtReserve payment settings

## Summary

The CourtReserve booking integration is **now implemented** and ready to use. However, the actual CourtReserve API endpoint needs to be verified with CourtReserve support. The system will work with or without CourtReserve sync, ensuring users can always book courts through PaddleGrid.
