const fs = require('fs');
const path = require('path');

const monthMap = {
  'Dec': '12', 'Jan': '01', 'Feb': '02', 'Mar': '03',
  'Apr': '04', 'May': '05', 'Jun': '06', 'Jul': '07',
  'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11'
};

function parseDate(dateStr) {
  const match = dateStr.match(/(\w+),\s+(\w+)\s+(\d+)/);
  if (!match) return '';

  const [, , month, day] = match;
  const monthNum = monthMap[month];
  const dayNum = day.replace(/\D/g, '').padStart(2, '0');

  return `2025-${monthNum}-${dayNum}`;
}

function parseTime(timeStr) {
  const [startStr, endStr] = timeStr.split(' - ').map(s => s.trim());

  const parseHour = (time) => {
    const isPM = time.includes('p');
    const isAM = time.includes('a');
    let [hour, minute = '00'] = time.replace(/[ap]/, '').split(':');
    let hourNum = parseInt(hour);

    if (isPM && hourNum !== 12) hourNum += 12;
    if (isAM && hourNum === 12) hourNum = 0;

    return `${hourNum.toString().padStart(2, '0')}:${minute.padStart(2, '0')}:00`;
  };

  return {
    start: parseHour(startStr),
    end: parseHour(endStr)
  };
}

function parseCourts(courtStr) {
  return courtStr.split(',').map(c => c.trim());
}

function parseCSVLine(line) {
  if (!line || line.startsWith('Reservation,')) return null;

  // Handle quoted fields properly
  const regex = /("(?:[^"]|"")*"|[^,]*)/g;
  const parts = [];
  let match;

  while ((match = regex.exec(line)) !== null) {
    if (match[1]) {
      parts.push(match[1].replace(/^"|"$/g, '').replace(/""/g, '"'));
    }
  }

  if (parts.length < 4) return null;

  try {
    const type = parts[0].trim();
    const dateStr = parts[1].trim();
    const timeStr = parts[2].trim();
    const courtsStr = parts[3].trim();
    const playersStr = parts[5] ? parts[5].trim() : '0';

    if (!type || !dateStr || !timeStr || !courtsStr) return null;

    const date = parseDate(dateStr);
    const time = parseTime(timeStr);
    const courts = parseCourts(courtsStr);
    const players = parseInt(playersStr) || 0;

    return {
      type,
      date,
      startTime: time.start,
      endTime: time.end,
      courts,
      ...(players > 0 && { players })
    };
  } catch (error) {
    console.error('Error parsing line:', line, error);
    return null;
  }
}

// Read CSV file
const csvPath = path.join(__dirname, '../src/lib/allreservationlist_25-12-08.csv');
const csvContent = fs.readFileSync(csvPath, 'utf-8');

const lines = csvContent.split('\n');
const reservations = [];

for (const line of lines) {
  const reservation = parseCSVLine(line);
  if (reservation) {
    reservations.push(reservation);
  }
}

console.log(`Parsed ${reservations.length} reservations`);

// Generate TypeScript code
const output = `// Pickleball Heaven Existing Reservations Data
// Auto-generated from CSV data for December 2025

export interface ExistingReservation {
  type: string;
  date: string;
  startTime: string;
  endTime: string;
  courts: string[];
  players?: number;
}

// All reservations from December 8-31, 2025
export const existingReservations: ExistingReservation[] = ${JSON.stringify(reservations, null, 2)};

// Check if a court is available at a specific date/time
export function isCourtAvailable(
  courtName: string,
  date: string,
  startTime: string,
  endTime: string
): boolean {
  const start = new Date(\`\${date}T\${startTime}\`);
  const end = new Date(\`\${date}T\${endTime}\`);

  for (const reservation of existingReservations) {
    if (reservation.date !== date) continue;
    if (!reservation.courts.includes(courtName)) continue;

    const resStart = new Date(\`\${reservation.date}T\${reservation.startTime}\`);
    const resEnd = new Date(\`\${reservation.date}T\${reservation.endTime}\`);

    // Check for overlap
    if (start < resEnd && end > resStart) {
      return false;
    }
  }

  return true;
}

// Get all reservations for a specific court and date
export function getCourtReservations(courtName: string, date: string): ExistingReservation[] {
  return existingReservations.filter(
    res => res.date === date && res.courts.includes(courtName)
  );
}

// Get available time slots for a court on a specific date
export function getAvailableSlots(
  courtName: string,
  date: string,
  durationHours: number = 1
): Array<{ start: string; end: string; label: string }> {
  const slots: Array<{ start: string; end: string; label: string }> = [];
  const openHour = 6; // 6 AM
  const closeHour = 24; // Midnight

  // Generate 30-minute increments
  for (let hour = openHour; hour < closeHour; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const startTime = \`\${hour.toString().padStart(2, '0')}:\${minute.toString().padStart(2, '0')}:00\`;

      // Calculate end time
      const totalMinutes = (hour * 60 + minute) + (durationHours * 60);
      const endHour = Math.floor(totalMinutes / 60);
      const endMinute = totalMinutes % 60;

      if (endHour > closeHour) break;

      const endTime = \`\${endHour.toString().padStart(2, '0')}:\${endMinute.toString().padStart(2, '0')}:00\`;

      if (isCourtAvailable(courtName, date, startTime, endTime)) {
        // Format display label (12-hour format)
        const formatTime = (time: string) => {
          const [h, m] = time.split(':').map(Number);
          const period = h >= 12 ? 'PM' : 'AM';
          const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
          return \`\${hour12}:\${m.toString().padStart(2, '0')} \${period}\`;
        };

        slots.push({
          start: startTime,
          end: endTime,
          label: \`\${formatTime(startTime)} - \${formatTime(endTime)}\`
        });
      }
    }
  }

  return slots;
}
`;

// Write to reservationData.ts
const outputPath = path.join(__dirname, '../src/lib/reservationData.ts');
fs.writeFileSync(outputPath, output, 'utf-8');

console.log(`✅ Generated reservationData.ts with ${reservations.length} reservations`);
console.log(`✅ Date range: ${reservations[0]?.date} to ${reservations[reservations.length - 1]?.date}`);
