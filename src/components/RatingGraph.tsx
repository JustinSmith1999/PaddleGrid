import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface RatingGraphProps {
  userId: string;
  days?: number;
}

interface RatingPoint {
  date: string;
  rating: number;
  change: number;
}

export function RatingGraph({ userId, days = 30 }: RatingGraphProps) {
  const [data, setData] = useState<RatingPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [trend, setTrend] = useState<'up' | 'down' | 'stable'>('stable');

  useEffect(() => {
    loadRatingHistory();
  }, [userId, days]);

  async function loadRatingHistory() {
    try {
      const { data: historyData, error } = await supabase.rpc('get_player_rating_trend', {
        p_player_id: userId,
        p_days: days
      });

      if (error) throw error;

      if (historyData && historyData.length > 0) {
        const formattedData = historyData.map((point: any) => ({
          date: new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          rating: parseFloat(point.rating),
          change: parseFloat(point.change_amount)
        }));

        setData(formattedData);

        if (formattedData.length > 1) {
          const firstRating = formattedData[0].rating;
          const lastRating = formattedData[formattedData.length - 1].rating;
          const diff = lastRating - firstRating;

          if (diff > 0.1) setTrend('up');
          else if (diff < -0.1) setTrend('down');
          else setTrend('stable');
        }
      }
    } catch (error) {
      console.error('Error loading rating history:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading rating history...</div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-gray-400">
        <Activity className="w-12 h-12 mb-2" />
        <p>No rating history yet</p>
        <p className="text-sm">Play matches to see your rating progression</p>
      </div>
    );
  }

  const minRating = Math.min(...data.map(d => d.rating));
  const maxRating = Math.max(...data.map(d => d.rating));
  const ratingRange = maxRating - minRating;
  const yAxisMin = Math.max(0, minRating - ratingRange * 0.2);
  const yAxisMax = Math.min(8, maxRating + ratingRange * 0.2);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Rating Progression</h3>
        <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
          trend === 'up' ? 'bg-green-100 text-green-700' :
          trend === 'down' ? 'bg-red-100 text-red-700' :
          'bg-gray-100 text-gray-700'
        }`}>
          {trend === 'up' ? <TrendingUp className="w-4 h-4" /> :
           trend === 'down' ? <TrendingDown className="w-4 h-4" /> :
           <Activity className="w-4 h-4" />}
          {trend === 'up' ? 'Improving' : trend === 'down' ? 'Declining' : 'Stable'}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="ratingGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            domain={[yAxisMin, yAxisMax]}
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            tickFormatter={(value) => value.toFixed(1)}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '8px'
            }}
            formatter={(value: any, name: string) => {
              if (name === 'rating') return [value.toFixed(2), 'Rating'];
              return [value, name];
            }}
          />
          <Area
            type="monotone"
            dataKey="rating"
            stroke="#10b981"
            strokeWidth={3}
            fill="url(#ratingGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>

      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="text-xs text-blue-600 font-medium mb-1">Lowest</div>
          <div className="text-lg font-bold text-blue-700">{minRating.toFixed(2)}</div>
        </div>
        <div className="bg-emerald-50 rounded-lg p-3">
          <div className="text-xs text-emerald-600 font-medium mb-1">Current</div>
          <div className="text-lg font-bold text-emerald-700">{data[data.length - 1].rating.toFixed(2)}</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-3">
          <div className="text-xs text-purple-600 font-medium mb-1">Highest</div>
          <div className="text-lg font-bold text-purple-700">{maxRating.toFixed(2)}</div>
        </div>
      </div>
    </div>
  );
}
