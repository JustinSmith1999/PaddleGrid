import React, { useState, useEffect } from 'react';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Testimonial {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  profiles: {
    id: string;
    full_name: string | null;
    first_name: string | null;
    last_name: string | null;
    profile_picture_url: string | null;
  };
}

interface TestimonialsCarouselProps {
  facilityId: string;
}

export function TestimonialsCarousel({ facilityId }: TestimonialsCarouselProps) {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    loadTestimonials();
  }, [facilityId]);

  const loadTestimonials = async () => {
    const { data } = await supabase
      .from('facility_testimonials')
      .select('*, profiles(*)')
      .eq('facility_id', facilityId)
      .eq('is_featured', true)
      .order('created_at', { ascending: false })
      .limit(10);

    if (data && data.length > 0) {
      setTestimonials(data);
    }
  };

  if (testimonials.length === 0) return null;

  const currentTestimonial = testimonials[currentIndex];
  const profile = currentTestimonial.profiles;
  const displayName = profile.full_name ||
    (profile.first_name && profile.last_name
      ? `${profile.first_name} ${profile.last_name}`
      : profile.first_name || profile.last_name || 'Anonymous Member');

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-md">
          <Quote className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Member Reviews</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">What our members say</p>
        </div>
      </div>

      <div className="relative bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-2xl p-8 border border-slate-200 dark:border-slate-600 shadow-lg">
        <div className="absolute top-4 left-4 opacity-10">
          <Quote className="w-16 h-16 text-emerald-600" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-1 mb-4">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-5 h-5 ${
                  i < currentTestimonial.rating
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-slate-300 dark:text-slate-600'
                }`}
              />
            ))}
          </div>

          <p className="text-lg text-slate-700 dark:text-slate-200 leading-relaxed mb-6 italic">
            "{currentTestimonial.comment}"
          </p>

          <div className="flex items-center gap-4">
            {profile.profile_picture_url && (
              <img
                src={profile.profile_picture_url}
                alt={displayName}
                className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500"
              />
            )}
            {!profile.profile_picture_url && (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-lg border-2 border-emerald-500">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-bold text-slate-900 dark:text-white">{displayName}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {new Date(currentTestimonial.created_at).toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>

        {testimonials.length > 1 && (
          <>
            <button
              onClick={prevTestimonial}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white dark:bg-slate-700 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110"
            >
              <ChevronLeft className="w-5 h-5 text-slate-700 dark:text-slate-300" />
            </button>
            <button
              onClick={nextTestimonial}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white dark:bg-slate-700 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110"
            >
              <ChevronRight className="w-5 h-5 text-slate-700 dark:text-slate-300" />
            </button>

            <div className="flex justify-center gap-2 mt-6">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentIndex
                      ? 'bg-emerald-500 w-6'
                      : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
