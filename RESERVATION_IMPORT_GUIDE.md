# Pickleball Heaven Reservation Import Guide

This guide explains how to use the existing reservation data from Pickleball Heaven to manage court availability.

## Current Setup

### 1. Courts Created
16 courts have been added to Pickleball Heaven facility:
- Championship Court #1 ($40/hr)
- Courts #2-#15 ($30/hr each)
- Court #16 (Championship) ($40/hr)
- Court #6 includes "Pickleball or Backyard Games" option

### 2. Reservation Data Integration
The system now checks against existing facility reservations when users try to book courts.

**File**: `src/lib/reservationData.ts`

Contains:
- `existingReservations` - Array of pre-existing bookings
- `isCourtAvailable()` - Checks if a court is available at a specific time
- `getCourtReservations()` - Gets all reservations for a court on a date
- `getAvailableSlots()` - Finds available time slots

### 3. Booking Modal Integration
The `BookingModal` component now:
- Checks against existing reservations before allowing bookings
- Shows warnings when a court has existing reservations
- Prevents double-booking of reserved times

## Expanding the Reservation Data

### Current Sample Data
The `reservationData.ts` file currently contains **sample data for December 8, 2025 only**. To add the complete reservation schedule:

### Step 1: Parse the Full CSV
You have reservations from **December 8-31, 2025**. To add them all:

1. Open `src/lib/reservationData.ts`
2. Expand the `existingReservations` array
3. Add entries for each reservation in your CSV

### Step 2: Reservation Format
Each reservation follows this format:

```typescript
{
  type: 'Court Reservation', // or 'Private Groups', 'Open Play', etc.
  date: '2025-12-08',        // YYYY-MM-DD format
  startTime: '07:00:00',     // HH:MM:SS format (24-hour)
  endTime: '09:00:00',       // HH:MM:SS format (24-hour)
  courts: ['Court #3'],      // Array of court names
  players: 5                 // Optional: number of players
}
```

### Step 3: Time Parsing Reference
- `7a - 9a` becomes `startTime: '07:00:00', endTime: '09:00:00'`
- `2p - 4p` becomes `startTime: '14:00:00', endTime: '16:00:00'`
- `9:30a - 12p` becomes `startTime: '09:30:00', endTime: '12:00:00'`

### Step 4: Multiple Courts
When a reservation covers multiple courts, list all courts in the array:

```typescript
{
  type: 'Private Groups',
  date: '2025-12-08',
  startTime: '08:00:00',
  endTime: '10:00:00',
  courts: [
    'Championship Court #1',
    'Court #10',
    'Court #11',
    'Court #12'
  ],
  players: 15
}
```

## Alternative: Database Import

For better performance with large datasets, you can import reservations directly into the database:

### Option A: Create "Block" Bookings
Create bookings in the database with a special "facility" user to block out times:

```sql
-- First, create a facility system user (requires proper auth setup)
-- Then insert bookings for blocked times

INSERT INTO bookings (
  court_id,
  user_id,
  facility_id,
  booking_date,
  start_time,
  end_time,
  duration_hours,
  total_amount,
  status,
  payment_status,
  notes
)
SELECT
  (SELECT id FROM courts WHERE name = 'Court #3' AND facility_id = 'bfb8aa81-fca9-48d9-b697-d13bba78430e'),
  (SELECT id FROM profiles WHERE email = 'system@pickleballheaven.com'),
  'bfb8aa81-fca9-48d9-b697-d13bba78430e',
  '2025-12-08',
  '07:00:00',
  '09:00:00',
  2,
  0.00,
  'confirmed',
  'complimentary',
  'Pre-existing facility reservation - Private Groups'
WHERE EXISTS (SELECT 1 FROM courts WHERE name = 'Court #3' AND facility_id = 'bfb8aa81-fca9-48d9-b697-d13bba78430e');
```

### Option B: Use Event Series
Create event series for recurring programs (like Open Play sessions):

```typescript
// Create series for "Advanced Open Play" sessions
// These automatically block court times and allow registration
```

## Checking Current Data

To see which courts have reservations:

```typescript
import { getCourtReservations } from '../lib/reservationData';

const reservations = getCourtReservations('Court #3', '2025-12-08');
console.log(reservations); // Shows all reservations for Court #3 on Dec 8
```

## Testing Availability

```typescript
import { isCourtAvailable } from '../lib/reservationData';

const available = isCourtAvailable(
  'Court #3',
  '2025-12-08',
  '07:00:00',
  '09:00:00'
);
console.log(available); // false - this time is blocked
```

## Next Steps

1. **Expand Data**: Add all December reservations to `reservationData.ts`
2. **Create Import Script**: Build a Node.js script to parse your CSV and generate the TypeScript data
3. **Database Migration**: Consider moving to database-based blocking for better scalability
4. **Admin Interface**: Build an admin panel to manage facility reservations
5. **Recurring Events**: Use the event_series system for regular programs

## Notes

- The current system works for December 2025 end-of-year reservations
- For ongoing operations, consider using the event_series tables instead
- Database import is recommended for datasets with 100+ reservations
- The in-memory approach (current) is fast but requires redeployment to update
