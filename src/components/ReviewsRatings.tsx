import { useState } from 'react';
import { Star, ThumbsUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Review {
  id: string;
  rating: number;
  title: string;
  review_text: string;
  helpful_count: number;
  created_at: string;
  user_id: string;
  profiles: {
    full_name: string;
    profile_picture_url: string;
  };
}

interface ReviewsRatingsProps {
  entityType: 'facility' | 'court' | 'event';
  entityId: string;
  reviews: Review[];
  averageRating: number;
  reviewCount: number;
  onReviewAdded?: () => void;
}

export default function ReviewsRatings({
  entityType,
  entityId,
  reviews,
  averageRating,
  reviewCount,
  onReviewAdded
}: ReviewsRatingsProps) {
  const { user } = useAuth();
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [hoveredStar, setHoveredStar] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    try {
      const table = `${entityType}_reviews`;
      const column = `${entityType}_id`;

      const { error } = await supabase
        .from(table)
        .insert({
          [column]: entityId,
          user_id: user.id,
          rating,
          title,
          review_text: reviewText
        });

      if (error) throw error;

      setShowReviewForm(false);
      setRating(5);
      setTitle('');
      setReviewText('');
      if (onReviewAdded) onReviewAdded();
    } catch (error) {
      console.error('Error submitting review:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkHelpful = async (reviewId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('review_helpfulness')
        .insert({
          review_id: reviewId,
          review_type: entityType,
          user_id: user.id,
          is_helpful: true
        });

      if (!error && onReviewAdded) onReviewAdded();
    } catch (error) {
      console.error('Error marking review helpful:', error);
    }
  };

  const renderStars = (count: number, interactive = false, size = 'medium') => {
    const sizeClass = size === 'small' ? 'w-4 h-4' : 'w-6 h-6';
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClass} ${
              star <= (interactive ? (hoveredStar || count) : count)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            } ${interactive ? 'cursor-pointer' : ''}`}
            onMouseEnter={() => interactive && setHoveredStar(star)}
            onMouseLeave={() => interactive && setHoveredStar(0)}
            onClick={() => interactive && setRating(star)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold">Reviews & Ratings</h3>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold">{averageRating.toFixed(1)}</span>
                {renderStars(Math.round(averageRating))}
              </div>
              <span className="text-gray-600">({reviewCount} reviews)</span>
            </div>
          </div>
          {user && !showReviewForm && (
            <button
              onClick={() => setShowReviewForm(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Write a Review
            </button>
          )}
        </div>

        {showReviewForm && (
          <form onSubmit={handleSubmitReview} className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="font-semibold mb-4">Write Your Review</h4>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Your Rating</label>
              {renderStars(rating, true)}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Review Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Sum up your experience"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Your Review</label>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                rows={4}
                placeholder="Share your experience..."
                required
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
              <button
                type="button"
                onClick={() => setShowReviewForm(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="border-t pt-4">
              <div className="flex items-start gap-4">
                <img
                  src={review.profiles?.profile_picture_url || '/n1_(2).jpg'}
                  alt={review.profiles?.full_name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">{review.profiles?.full_name}</span>
                    {renderStars(review.rating, false, 'small')}
                  </div>
                  <h4 className="font-semibold mb-2">{review.title}</h4>
                  <p className="text-gray-700 mb-2">{review.review_text}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>{new Date(review.created_at).toLocaleDateString()}</span>
                    <button
                      onClick={() => handleMarkHelpful(review.id)}
                      className="flex items-center gap-1 hover:text-green-600"
                    >
                      <ThumbsUp className="w-4 h-4" />
                      Helpful ({review.helpful_count})
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
