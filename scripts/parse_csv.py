#!/usr/bin/env python3
import csv
import json
import re

def parse_date(date_str):
    """Convert 'Mon, Dec 8th' to '2025-12-08'"""
    month_map = {
        'Dec': '12', 'Jan': '01', 'Feb': '02', 'Mar': '03',
        'Apr': '04', 'May': '05', 'Jun': '06', 'Jul': '07',
        'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11'
    }

    match = re.search(r'(\w+),\s+(\w+)\s+(\d+)', date_str)
    if not match:
        return ''

    _, month, day = match.groups()
    month_num = month_map.get(month, '01')
    day_num = day.replace('st', '').replace('nd', '').replace('rd', '').replace('th', '').zfill(2)

    return f'2025-{month_num}-{day_num}'

def parse_time(time_str):
    """Convert '7a - 9a' or '9:30a - 12p' to 24-hour format"""
    parts = time_str.split(' - ')
    if len(parts) != 2:
        return None, None

    start_str, end_str = parts

    def convert_to_24h(time):
        is_pm = 'p' in time.lower()
        is_am = 'a' in time.lower()

        # Remove AM/PM markers
        time = re.sub(r'[ap]', '', time, flags=re.IGNORECASE).strip()

        if ':' in time:
            hour, minute = time.split(':')
        else:
            hour = time
            minute = '00'

        hour = int(hour)

        # Convert to 24-hour format
        if is_pm and hour != 12:
            hour += 12
        elif is_am and hour == 12:
            hour = 0

        return f'{hour:02d}:{minute}:00'

    return convert_to_24h(start_str), convert_to_24h(end_str)

def parse_courts(courts_str):
    """Parse comma-separated court names"""
    return [c.strip() for c in courts_str.split(',')]

# Read CSV
reservations = []
csv_path = 'src/lib/allreservationlist_25-12-08.csv'

with open(csv_path, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        try:
            res_type = row['Reservation'].strip()
            date = parse_date(row['Date'])
            start_time, end_time = parse_time(row['Time'])
            courts = parse_courts(row['Courts'])
            players = int(row['Players']) if row['Players'].strip() else 0

            if res_type and date and start_time and end_time and courts:
                reservation = {
                    'type': res_type,
                    'date': date,
                    'startTime': start_time,
                    'endTime': end_time,
                    'courts': courts
                }
                if players > 0:
                    reservation['players'] = players

                reservations.append(reservation)
        except Exception as e:
            print(f'Error parsing row: {e}')
            continue

print(f'Parsed {len(reservations)} reservations')

# Generate TypeScript file
output = f'''// Pickleball Heaven Existing Reservations Data
// Auto-generated from CSV data for December 8-31, 2025
// Total reservations: {len(reservations)}

export interface ExistingReservation {{
  type: string;
  date: string;
  startTime: string;
  endTime: string;
  courts: string[];
  players?: number;
}}

// All reservations from December 8-31, 2025
export const existingReservations: ExistingReservation[] = {json.dumps(reservations, indent=2)};

// Check if a court is available at a specific date/time
export function isCourtAvailable(
  courtName: string,
  date: string,
  startTime: string,
  endTime: string
): boolean {{
  const start = new Date(`${{date}}T${{startTime}}`);
  const end = new Date(`${{date}}T${{endTime}}`);

  for (const reservation of existingReservations) {{
    if (reservation.date !== date) continue;
    if (!reservation.courts.includes(courtName)) continue;

    const resStart = new Date(`${{reservation.date}}T${{reservation.startTime}}`);
    const resEnd = new Date(`${{reservation.date}}T${{reservation.endTime}}`);

    // Check for overlap
    if (start < resEnd && end > resStart) {{
      return false;
    }}
  }}

  return true;
}}

// Get all reservations for a specific court and date
export function getCourtReservations(courtName: string, date: string): ExistingReservation[] {{
  return existingReservations.filter(
    res => res.date === date && res.courts.includes(courtName)
  );
}}

// Get available time slots for a court on a specific date
export function getAvailableSlots(
  courtName: string,
  date: string,
  durationHours: number = 1
): Array<{{ start: string; end: string; label: string }}> {{
  const slots: Array<{{ start: string; end: string; label: string }}> = [];
  const openHour = 6; // 6 AM
  const closeHour = 24; // Midnight

  // Generate 30-minute increments
  for (let hour = openHour; hour < closeHour; hour++) {{
    for (let minute = 0; minute < 60; minute += 30) {{
      const startTime = `${{hour.toString().padStart(2, '0')}}:${{minute.toString().padStart(2, '0')}}:00`;

      // Calculate end time
      const totalMinutes = (hour * 60 + minute) + (durationHours * 60);
      const endHour = Math.floor(totalMinutes / 60);
      const endMinute = totalMinutes % 60;

      if (endHour > closeHour) break;

      const endTime = `${{endHour.toString().padStart(2, '0')}}:${{endMinute.toString().padStart(2, '0')}}:00`;

      if (isCourtAvailable(courtName, date, startTime, endTime)) {{
        // Format display label (12-hour format)
        const formatTime = (time: string) => {{
          const [h, m] = time.split(':').map(Number);
          const period = h >= 12 ? 'PM' : 'AM';
          const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
          return `${{hour12}}:${{m.toString().padStart(2, '0')}} ${{period}}`;
        }};

        slots.push({{
          start: startTime,
          end: endTime,
          label: `${{formatTime(startTime)}} - ${{formatTime(endTime)}}`
        }});
      }}
    }}
  }}

  return slots;
}}
'''

# Write to file
with open('src/lib/reservationData.ts', 'w') as f:
    f.write(output)

print(f'✅ Generated reservationData.ts with {len(reservations)} reservations')
if reservations:
    print(f'✅ Date range: {reservations[0]["date"]} to {reservations[-1]["date"]}')
