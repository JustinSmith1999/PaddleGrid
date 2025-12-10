// Script to parse CSV reservation data into TypeScript format
import { ExistingReservation } from './reservationData';

interface MonthMap {
  [key: string]: string;
}

const monthMap: MonthMap = {
  'Dec': '12', 'Jan': '01', 'Feb': '02', 'Mar': '03',
  'Apr': '04', 'May': '05', 'Jun': '06', 'Jul': '07',
  'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11'
};

function parseDate(dateStr: string): string {
  const match = dateStr.match(/(\w+),\s+(\w+)\s+(\d+)/);
  if (!match) return '';

  const [, , month, day] = match;
  const monthNum = monthMap[month];
  const dayNum = day.replace(/\D/g, '').padStart(2, '0');

  // December 2025
  return `2025-${monthNum}-${dayNum}`;
}

function parseTime(timeStr: string): { start: string; end: string } {
  const [startStr, endStr] = timeStr.split(' - ').map(s => s.trim());

  const parseHour = (time: string): string => {
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

function parseCourts(courtStr: string): string[] {
  return courtStr.split(',').map(c => c.trim());
}

export function parseCSVLine(line: string): ExistingReservation | null {
  // Skip header or empty lines
  if (!line || line.startsWith('Reservation,')) return null;

  const parts = line.split(',');
  if (parts.length < 4) return null;

  try {
    const type = parts[0].trim();
    const dateStr = parts[1].replace(/"/g, '').trim();
    const timeStr = parts[2].trim();
    const courtsStr = parts[3].replace(/"/g, '').trim();
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
      players
    };
  } catch (error) {
    console.error('Error parsing line:', line, error);
    return null;
  }
}

export function parseCSVContent(csvContent: string): ExistingReservation[] {
  const lines = csvContent.split('\n');
  const reservations: ExistingReservation[] = [];

  for (const line of lines) {
    const reservation = parseCSVLine(line);
    if (reservation) {
      reservations.push(reservation);
    }
  }

  return reservations;
}
