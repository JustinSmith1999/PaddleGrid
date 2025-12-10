import { useState } from 'react';
import { Heart, MessageCircle, Trophy, TrendingUp, MapPin, Clock, Flame } from 'lucide-react';
import { Activity, giveKudos, removeKudos, addComment, getComments } from '../lib/activityUtils';
import { formatDistanceToNow } from '../lib/dateUtils';

interface ActivityCardProps {
  activity: Activity;
  onUpdate?: () => void;
}

export default function ActivityCard({ activity, onUpdate }: ActivityCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleKudos = async () => {
    if (activity.user_has_given_kudos) {
      await removeKudos(activity.id);
    } else {
      await giveKudos(activity.id);
    }
    onUpdate?.();
  };

  const loadComments = async () => {
    if (!showComments) {
      const data = await getComments(activity.id);
      setComments(data);
    }
    setShowComments(!showComments);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setLoading(true);
    const result = await addComment(activity.id, commentText);
    if (result.success) {
      setCommentText('');
      const data = await getComments(activity.id);
      setComments(data);
      onUpdate?.();
    }
    setLoading(false);
  };

  const isWin = activity.is_win;
  const ratingChange = activity.rating_change;

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition">
      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
            {activity.profiles?.full_name?.charAt(0) || 'A'}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">
                {activity.profiles?.full_name || 'Athlete'}
              </h3>
              {isWin && (
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                  <Trophy className="w-3 h-3 inline mr-1" />
                  Win
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500">
              {new Date(activity.activity_date).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
              })}
              {activity.start_time && ` at ${activity.start_time}`}
            </p>
          </div>
          <span className="text-xs text-gray-400">
            {formatDistanceToNow(new Date(activity.created_at))}
          </span>
        </div>

        <div className="mb-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg font-bold text-gray-900 capitalize">
              {activity.match_type?.replace('_', ' ')} {activity.activity_type}
            </span>
          </div>

          {activity.facilities && (
            <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
              <MapPin className="w-4 h-4" />
              <span>{activity.facilities.name}</span>
              {activity.courts && <span className="text-gray-400">• {activity.courts.name}</span>}
            </div>
          )}

          {activity.duration_minutes && (
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>{activity.duration_minutes} minutes</span>
            </div>
          )}
        </div>

        {(activity.score_us !== undefined && activity.score_them !== undefined) && (
          <div className="bg-gray-50 rounded-lg p-4 mb-3">
            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <div className={`text-3xl font-bold ${isWin ? 'text-green-600' : 'text-gray-400'}`}>
                  {activity.score_us}
                </div>
                <div className="text-xs text-gray-600 mt-1">Us</div>
              </div>
              <div className="text-2xl font-light text-gray-400">-</div>
              <div className="text-center">
                <div className={`text-3xl font-bold ${!isWin ? 'text-red-600' : 'text-gray-400'}`}>
                  {activity.score_them}
                </div>
                <div className="text-xs text-gray-600 mt-1">Them</div>
              </div>
            </div>
          </div>
        )}

        {ratingChange !== undefined && ratingChange !== 0 && (
          <div className={`flex items-center gap-2 p-2 rounded-lg mb-3 ${
            ratingChange > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-medium">
              {ratingChange > 0 ? '+' : ''}{ratingChange.toFixed(2)} rating
              {activity.rating_after && ` (${activity.rating_after.toFixed(2)})`}
            </span>
          </div>
        )}

        {activity.description && (
          <p className="text-gray-700 mb-3">
            {activity.description}
          </p>
        )}

        {activity.effort_level && activity.effort_level >= 8 && (
          <div className="flex items-center gap-2 text-orange-600 text-sm mb-3">
            <Flame className="w-4 h-4" />
            <span>High intensity workout</span>
          </div>
        )}

        <div className="flex items-center gap-4 pt-3 border-t border-gray-200">
          <button
            onClick={handleKudos}
            className={`flex items-center gap-2 transition ${
              activity.user_has_given_kudos
                ? 'text-red-600'
                : 'text-gray-600 hover:text-red-600'
            }`}
          >
            <Heart
              className="w-5 h-5"
              fill={activity.user_has_given_kudos ? 'currentColor' : 'none'}
            />
            <span className="text-sm font-medium">
              {activity.kudos_count || 0}
            </span>
          </button>

          <button
            onClick={loadComments}
            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm font-medium">
              {activity.comment_count || 0}
            </span>
          </button>
        </div>
      </div>

      {showComments && (
        <div className="border-t border-gray-200 bg-gray-50 p-4">
          <div className="space-y-3 mb-3">
            {comments.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-2">
                No comments yet. Be the first to comment!
              </p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                    {comment.profiles?.full_name?.charAt(0) || 'U'}
                  </div>
                  <div className="flex-1 bg-white rounded-lg p-2">
                    <div className="font-medium text-sm text-gray-900">
                      {comment.profiles?.full_name || 'User'}
                    </div>
                    <p className="text-sm text-gray-700">{comment.content}</p>
                    <span className="text-xs text-gray-400">
                      {formatDistanceToNow(new Date(comment.created_at))}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleAddComment} className="flex gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
            <button
              type="submit"
              disabled={loading || !commentText.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 text-sm font-medium"
            >
              Post
            </button>
          </form>
        </div>
      )}
    </div>
  );
}