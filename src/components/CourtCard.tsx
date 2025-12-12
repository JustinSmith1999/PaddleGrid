import { Clock, DollarSign, Activity } from 'lucide-react';

interface Court {
  id: string;
  name: string;
  description: string | null;
  hourly_rate: number;
  image_url: string | null;
  is_active: boolean;
  location?: string;
}

interface AvailabilityBlock {
  start_time: string;
  end_time: string;
}

interface CourtCardProps {
  court: Court;
  onBook: (court: Court) => void;
  availabilityBlocks: AvailabilityBlock[];
}

function formatTime(time24: string): string {
  const [hour, minute] = time24.split(':').map(Number);
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  const ampm = hour >= 12 ? 'PM' : 'AM';
  return `${displayHour}:${minute.toString().padStart(2, '0')} ${ampm}`;
}

function findNextAvailable(blocks: AvailabilityBlock[]): string | null {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const sortedBlocks = blocks
    .map(block => {
      const [startH, startM] = block.start_time.split(':').map(Number);
      const [endH, endM] = block.end_time.split(':').map(Number);
      return {
        startMinutes: startH * 60 + startM,
        endMinutes: endH * 60 + endM,
        endTime: block.end_time
      };
    })
    .sort((a, b) => a.startMinutes - b.startMinutes);

  if (sortedBlocks.length === 0) {
    return null;
  }

  let lastEnd = 0;

  for (const block of sortedBlocks) {
    if (currentMinutes < block.startMinutes && currentMinutes >= lastEnd) {
      return 'Now';
    }

    if (currentMinutes >= block.startMinutes && currentMinutes < block.endMinutes) {
      return formatTime(block.endTime);
    }

    lastEnd = Math.max(lastEnd, block.endMinutes);
  }

  if (currentMinutes >= lastEnd) {
    return 'Now';
  }

  return null;
}

export function CourtCard({ court, onBook, availabilityBlocks }: CourtCardProps) {
  const nextAvailable = findNextAvailable(availabilityBlocks);
  const isAvailableNow = nextAvailable === 'Now';

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500">
      <div className={`p-4 border-b border-slate-200 dark:border-slate-700 ${
        isAvailableNow
          ? 'bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20'
          : 'bg-slate-50 dark:bg-slate-800/50'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className={`w-5 h-5 ${isAvailableNow ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
            <div>
              <p className={`text-xs font-medium ${isAvailableNow ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
                Next Available
              </p>
              <p className={`text-lg font-bold ${isAvailableNow ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-900 dark:text-white'}`}>
                {nextAvailable || 'Check Schedule'}
              </p>
            </div>
          </div>
          <Activity className={`w-8 h-8 ${isAvailableNow ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600'}`} />
        </div>
      </div>

      <div className="p-5">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
          {court.name}
        </h3>
        {court.location && (
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            {court.location}
          </p>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <div>
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                ${court.hourly_rate}
              </span>
              <span className="text-slate-500 dark:text-slate-400 text-sm ml-1">/hour</span>
            </div>
          </div>

          <button
            onClick={() => onBook(court)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-2.5 rounded-lg transition-all duration-200 hover:shadow-lg"
          >
            Book Now
          </button>
        </div>
      </div>
    </div>
  );
}
