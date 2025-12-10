import { Award, TrendingUp, Zap, Target } from 'lucide-react';
import { PersonalRecord } from '../lib/activityUtils';
import { formatDistanceToNow } from '../lib/dateUtils';

interface PersonalRecordsWidgetProps {
  records: PersonalRecord[];
}

export default function PersonalRecordsWidget({ records }: PersonalRecordsWidgetProps) {
  const getRecordIcon = (type: string) => {
    switch (type) {
      case 'highest_rating':
        return <TrendingUp className="w-5 h-5" />;
      case 'rating_gain':
        return <Zap className="w-5 h-5" />;
      case 'win_streak':
        return <Target className="w-5 h-5" />;
      default:
        return <Award className="w-5 h-5" />;
    }
  };

  const getRecordLabel = (type: string) => {
    switch (type) {
      case 'highest_rating':
        return 'Highest Rating';
      case 'rating_gain':
        return 'Biggest Rating Gain';
      case 'win_streak':
        return 'Longest Win Streak';
      case 'most_matches_week':
        return 'Most Matches in a Week';
      case 'longest_match':
        return 'Longest Match';
      case 'biggest_comeback':
        return 'Biggest Comeback';
      default:
        return 'Personal Record';
    }
  };

  const formatValue = (record: PersonalRecord) => {
    switch (record.record_type) {
      case 'highest_rating':
      case 'rating_gain':
        return record.value.toFixed(2);
      case 'win_streak':
      case 'most_matches_week':
        return `${record.value} ${record.record_type === 'win_streak' ? 'wins' : 'matches'}`;
      case 'longest_match':
        return `${record.value} min`;
      default:
        return record.value.toString();
    }
  };

  if (records.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-bold text-gray-900">Personal Records</h3>
        </div>
        <p className="text-sm text-gray-600">
          Play matches to set your first personal records!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-2 mb-4">
        <Award className="w-6 h-6 text-blue-600" />
        <h3 className="text-lg font-bold text-gray-900">Personal Records</h3>
      </div>

      <div className="space-y-3">
        {records.slice(0, 5).map((record) => (
          <div key={record.id} className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                  {getRecordIcon(record.record_type)}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900 text-sm">
                    {getRecordLabel(record.record_type)}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {formatDistanceToNow(new Date(record.achieved_at))}
                  </div>
                  {record.previous_value !== null && record.previous_value !== undefined && (
                    <div className="text-xs text-green-600 mt-1">
                      +{(record.value - record.previous_value).toFixed(2)} improvement
                    </div>
                  )}
                </div>
              </div>
              <div className="text-xl font-bold text-gray-900 flex-shrink-0">
                {formatValue(record)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {records.length > 5 && (
        <button className="w-full mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium">
          View all records
        </button>
      )}
    </div>
  );
}