import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Block {
  id: string;
  court_id: string;
  block_date: string;
  start_time: string;
  end_time: string;
  block_type: string;
  notes: string | null;
  court?: {
    name: string;
  };
}

const BLOCK_TYPE_COLORS: Record<string, string> = {
  reservation: 'bg-blue-500',
  maintenance: 'bg-yellow-500',
  private_event: 'bg-purple-500',
  clinic: 'bg-green-500',
  tournament: 'bg-red-500',
  league: 'bg-indigo-500',
  staff_block: 'bg-gray-500',
  other: 'bg-gray-400',
};

export function AvailabilityCalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourt, setSelectedCourt] = useState('');
  const [courts, setCourts] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetchCourts();
  }, []);

  useEffect(() => {
    fetchBlocks();
  }, [currentDate, selectedCourt]);

  const fetchCourts = async () => {
    const { data } = await supabase
      .from('courts')
      .select('id, name')
      .order('name');

    if (data) {
      setCourts(data);
    }
  };

  const fetchBlocks = async () => {
    setLoading(true);

    const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    let query = supabase
      .from('court_availability_blocks')
      .select(`
        *,
        court:courts(name)
      `)
      .gte('block_date', startDate.toISOString().split('T')[0])
      .lte('block_date', endDate.toISOString().split('T')[0]);

    if (selectedCourt) {
      query = query.eq('court_id', selectedCourt);
    }

    const { data } = await query;

    if (data) {
      setBlocks(data as Block[]);
    }

    setLoading(false);
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    return { daysInMonth, startDayOfWeek };
  };

  const getBlocksForDate = (date: number) => {
    const dateStr = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      date
    ).toISOString().split('T')[0];

    return blocks.filter((block) => block.block_date === dateStr);
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const { daysInMonth, startDayOfWeek } = getDaysInMonth();
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={previousMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-semibold text-gray-900">{monthName}</h2>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <select
          value={selectedCourt}
          onChange={(e) => setSelectedCourt(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Courts</option>
          {courts.map((court) => (
            <option key={court.id} value={court.id}>
              {court.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap gap-4 text-xs">
        {Object.entries(BLOCK_TYPE_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded ${color}`} />
            <span className="text-gray-600 capitalize">{type.replace('_', ' ')}</span>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="px-2 py-3 text-center text-sm font-semibold text-gray-700">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 bg-white">
            {Array.from({ length: startDayOfWeek }).map((_, idx) => (
              <div key={`empty-${idx}`} className="aspect-square border-r border-b border-gray-200 bg-gray-50" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const date = idx + 1;
              const dateBlocks = getBlocksForDate(date);
              const isToday =
                new Date().getDate() === date &&
                new Date().getMonth() === currentDate.getMonth() &&
                new Date().getFullYear() === currentDate.getFullYear();

              return (
                <div
                  key={date}
                  className={`aspect-square border-r border-b border-gray-200 p-2 ${
                    isToday ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className={`text-sm font-semibold mb-1 ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                    {date}
                  </div>
                  <div className="space-y-1">
                    {dateBlocks.slice(0, 3).map((block) => (
                      <div
                        key={block.id}
                        className={`text-xs px-1 py-0.5 rounded text-white truncate ${
                          BLOCK_TYPE_COLORS[block.block_type] || 'bg-gray-400'
                        }`}
                        title={`${block.court?.name} - ${block.start_time.slice(0, 5)}-${block.end_time.slice(0, 5)}`}
                      >
                        {block.start_time.slice(0, 5)}
                      </div>
                    ))}
                    {dateBlocks.length > 3 && (
                      <div className="text-xs text-gray-500 font-medium">
                        +{dateBlocks.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
