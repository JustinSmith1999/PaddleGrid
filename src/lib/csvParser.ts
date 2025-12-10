// Enhanced CSV parser for reservation imports
// Handles the format: Reservation,Date,Time,Courts,Ball Machine,Players

interface ParsedBlock {
  courtName: string;
  date: string; // YYYY-MM-DD format
  startTime: string; // HH:MM:SS format
  endTime: string; // HH:MM:SS format
  blockType: string;
  notes?: string;
  playerCount?: number;
  valid: boolean;
  errors: string[];
  originalRow: number;
}

const monthMap: Record<string, string> = {
  'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
  'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
  'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
};

function parseReservationDate(dateStr: string): string | null {
  // Format: "Mon, Dec 8th" -> "2025-12-08"
  const match = dateStr.match(/\w+,\s+(\w+)\s+(\d+)/);
  if (!match) return null;

  const [, monthStr, dayStr] = match;
  const month = monthMap[monthStr];
  if (!month) return null;

  const day = dayStr.replace(/\D/g, '').padStart(2, '0');

  // Determine year based on month (Dec = 2024, Jan-Nov = 2025)
  const year = month === '12' ? '2024' : '2025';

  return `${year}-${month}-${day}`;
}

function parseTimeRange(timeStr: string): { start: string; end: string } | null {
  // Format: "7a - 9a" or "10:30a - 12p" -> "07:00:00" to "09:00:00"
  const match = timeStr.match(/^(.+?)\s*-\s*(.+)$/);
  if (!match) return null;

  const [, startStr, endStr] = match;

  const parseTime = (time: string): string | null => {
    const isPM = time.toLowerCase().includes('p');
    const isAM = time.toLowerCase().includes('a');

    const cleanTime = time.replace(/[ap]/gi, '').trim();
    const parts = cleanTime.split(':');

    let hour = parseInt(parts[0]);
    const minute = parts[1] ? parseInt(parts[1]) : 0;

    if (isNaN(hour) || isNaN(minute)) return null;

    if (isPM && hour !== 12) hour += 12;
    if (isAM && hour === 12) hour = 0;

    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
  };

  const start = parseTime(startStr);
  const end = parseTime(endStr);

  if (!start || !end) return null;

  return { start, end };
}

function normalizeBlockType(reservationType: string): string {
  const lower = reservationType.toLowerCase();

  if (lower.includes('private group') || lower.includes('private lesson')) {
    return 'private_event';
  }
  if (lower.includes('clinic')) {
    return 'clinic';
  }
  if (lower.includes('tournament')) {
    return 'tournament';
  }
  if (lower.includes('league') || lower.includes('seasonal')) {
    return 'league';
  }
  if (lower.includes('open play')) {
    return 'reservation'; // Open play is a type of reservation
  }

  return 'reservation';
}

function parseCSVLine(line: string, rowNumber: number): string | null {
  // Basic CSV parsing - handles quoted fields with commas
  const fields: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      fields.push(currentField.trim());
      currentField = '';
    } else {
      currentField += char;
    }
  }
  fields.push(currentField.trim());

  return fields.length >= 4 ? JSON.stringify(fields) : null;
}

export function parseReservationCSV(csvContent: string): ParsedBlock[] {
  const lines = csvContent.split('\n').filter(line => line.trim());

  if (lines.length < 2) return [];

  // Skip header row
  const dataLines = lines.slice(1);
  const blocks: ParsedBlock[] = [];

  for (let i = 0; i < dataLines.length; i++) {
    const line = dataLines[i];
    const fieldsJson = parseCSVLine(line, i + 2);

    if (!fieldsJson) continue;

    const fields = JSON.parse(fieldsJson) as string[];

    // Expected format: Reservation,Date,Time,Courts,Ball Machine,Players
    const reservationType = fields[0] || '';
    const dateStr = fields[1] || '';
    const timeStr = fields[2] || '';
    const courtsStr = fields[3] || '';
    const playersStr = fields[5] || '0';

    // Parse date and time
    const date = parseReservationDate(dateStr);
    const timeRange = parseTimeRange(timeStr);
    const playerCount = parseInt(playersStr) || 0;
    const blockType = normalizeBlockType(reservationType);

    // Split courts by comma to handle multiple courts in one reservation
    const courtNames = courtsStr
      .split(',')
      .map(c => c.trim())
      .filter(c => c.length > 0);

    // Create a block for each court
    for (const courtName of courtNames) {
      const block: ParsedBlock = {
        courtName,
        date: date || '',
        startTime: timeRange?.start || '',
        endTime: timeRange?.end || '',
        blockType,
        notes: reservationType,
        playerCount,
        valid: true,
        errors: [],
        originalRow: i + 2
      };

      // Validate
      if (!courtName) {
        block.errors.push('Missing court name');
      }
      if (!date) {
        block.errors.push('Invalid date format');
      }
      if (!timeRange) {
        block.errors.push('Invalid time format');
      }

      block.valid = block.errors.length === 0;
      blocks.push(block);
    }
  }

  return blocks;
}

export type { ParsedBlock };
