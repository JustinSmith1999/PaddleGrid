import { Flame, Calendar, Trophy } from 'lucide-react';
import { Streak } from '../lib/activityUtils';

interface StreaksWidgetProps {
  streaks: Streak[];
}

export default function StreaksWidget({ streaks }: StreaksWidgetProps) {
  const dailyStreak = streaks.find(s => s.streak_type === 'daily');
  const winStreak = streaks.find(s => s.streak_type === 'win_streak');
  const weeklyStreak = streaks.find(s => s.streak_type === 'weekly');

  const getStreakIcon = (type: string) => {
    switch (type) {
      case 'daily':
        return <Calendar className="w-5 h-5" />;
      case 'win_streak':
        return <Trophy className="w-5 h-5" />;
      case 'weekly':
        return <Flame className="w-5 h-5" />;
      default:
        return <Flame className="w-5 h-5" />;
    }
  };

  const getStreakLabel = (type: string) => {
    switch (type) {
      case 'daily':
        return 'Day Streak';
      case 'win_streak':
        return 'Win Streak';
      case 'weekly':
        return 'Week Streak';
      default:
        return 'Streak';
    }
  };

  const getStreakColor = (type: string) => {
    switch (type) {
      case 'daily':
        return 'from-blue-500 to-cyan-500';
      case 'win_streak':
        return 'from-yellow-500 to-orange-500';
      case 'weekly':
        return 'from-purple-500 to-pink-500';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  if (!dailyStreak && !winStreak && !weeklyStreak) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-2 mb-4">
          <Flame className="w-6 h-6 text-orange-600" />
          <h3 className="text-lg font-bold text-gray-900">Streaks</h3>
        </div>
        <p className="text-sm text-gray-600">
          Start playing to build your streaks!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-2 mb-4">
        <Flame className="w-6 h-6 text-orange-600" />
        <h3 className="text-lg font-bold text-gray-900">Streaks</h3>
      </div>

      <div className="space-y-3">
        {dailyStreak && dailyStreak.current_count > 0 && (
          <div className={`bg-gradient-to-r ${getStreakColor('daily')} rounded-lg p-4 text-white`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {getStreakIcon('daily')}
                <span className="font-medium">{getStreakLabel('daily')}</span>
              </div>
              <span className="text-2xl font-bold">{dailyStreak.current_count}</span>
            </div>
            <div className="text-xs text-white text-opacity-90">
              Longest: {dailyStreak.longest_count} days
            </div>
          </div>
        )}

        {winStreak && winStreak.current_count > 0 && (
          <div className={`bg-gradient-to-r ${getStreakColor('win_streak')} rounded-lg p-4 text-white`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {getStreakIcon('win_streak')}
                <span className="font-medium">{getStreakLabel('win_streak')}</span>
              </div>
              <span className="text-2xl font-bold">{winStreak.current_count}</span>
            </div>
            <div className="text-xs text-white text-opacity-90">
              Longest: {winStreak.longest_count} wins
            </div>
          </div>
        )}

        {weeklyStreak && weeklyStreak.current_count > 0 && (
          <div className={`bg-gradient-to-r ${getStreakColor('weekly')} rounded-lg p-4 text-white`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {getStreakIcon('weekly')}
                <span className="font-medium">{getStreakLabel('weekly')}</span>
              </div>
              <span className="text-2xl font-bold">{weeklyStreak.current_count}</span>
            </div>
            <div className="text-xs text-white text-opacity-90">
              Longest: {weeklyStreak.longest_count} weeks
            </div>
          </div>
        )}

        {(!dailyStreak || dailyStreak.current_count === 0) &&
         (!winStreak || winStreak.current_count === 0) &&
         (!weeklyStreak || weeklyStreak.current_count === 0) && (
          <div className="text-center py-4">
            <p className="text-sm text-gray-600">
              No active streaks. Play a match to get started!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}