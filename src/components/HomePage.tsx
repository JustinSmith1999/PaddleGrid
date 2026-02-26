import { useState, useEffect } from 'react';
import { Play, Heart, MessageCircle, Share2, Users, MapPin, Calendar, TrendingUp, Flame, Award } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Post {
  id: string;
  user_name: string;
  user_avatar: string;
  time_ago: string;
  content: string;
  image_url: string;
  likes: number;
  comments: number;
  location?: string;
}

interface HomePageProps {
  onAuthRequired: (mode?: 'login' | 'signup' | 'facility') => void;
}

export function HomePage({ onAuthRequired }: HomePageProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'for-you' | 'following'>('for-you');

  const samplePosts: Post[] = [
    {
      id: '1',
      user_name: 'sarahpickle',
      user_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
      time_ago: '2h',
      content: 'Just had the best game ever! Finally beat my personal record 🎉',
      image_url: '/whie_pickleball.webp',
      likes: 342,
      comments: 28,
      location: 'Sunset Courts'
    },
    {
      id: '2',
      user_name: 'mikethepro',
      user_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike',
      time_ago: '4h',
      content: 'Who wants to play this Saturday? Looking for doubles partners!',
      image_url: '/n1_(2).jpg',
      likes: 156,
      comments: 42,
      location: 'Downtown Pickleball Club'
    },
    {
      id: '3',
      user_name: 'jessicaserves',
      user_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jessica',
      time_ago: '6h',
      content: 'Tournament prep going strong! Love this community 💪',
      image_url: '/2025-10-30.webp',
      likes: 521,
      comments: 67,
      location: 'Elite Training Center'
    }
  ];

  return (
    <div className="min-h-screen bg-black">
      {/* Mobile-first feed layout */}
      <div className="max-w-2xl mx-auto bg-black min-h-screen">
        {/* Top Navigation - Social media style */}
        <div className="sticky top-0 z-50 bg-black/95 backdrop-blur-lg border-b border-gray-800">
          <div className="flex items-center justify-between px-4 py-3">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              PaddleGrid
            </h1>
            <div className="flex gap-3">
              <button
                onClick={() => onAuthRequired('login')}
                className="px-6 py-2 text-white font-medium hover:text-emerald-400 transition-colors"
              >
                Log in
              </button>
              <button
                onClick={() => onAuthRequired('signup')}
                className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-full hover:scale-105 transition-transform"
              >
                Sign up
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-gray-800">
            <button
              onClick={() => setActiveTab('for-you')}
              className={`flex-1 py-4 text-sm font-semibold transition-colors relative ${
                activeTab === 'for-you' ? 'text-white' : 'text-gray-500'
              }`}
            >
              For You
              {activeTab === 'for-you' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('following')}
              className={`flex-1 py-4 text-sm font-semibold transition-colors relative ${
                activeTab === 'following' ? 'text-white' : 'text-gray-500'
              }`}
            >
              Following
              {activeTab === 'following' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full" />
              )}
            </button>
          </div>
        </div>

        {/* Hero Section - Social Media Style */}
        <div className="relative h-[60vh] overflow-hidden">
          <img
            src="/gettyimages-1355170068-scaled-1.jpg"
            alt="Pickleball action"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-end p-8">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-3 leading-tight">
              Your pickleball
              <br />
              community lives here
            </h2>
            <p className="text-lg text-gray-300 mb-6">
              Share moments, find players, book courts
            </p>
            <button
              onClick={() => onAuthRequired('signup')}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-full hover:scale-105 transition-transform shadow-xl"
            >
              <Play className="w-5 h-5" />
              Join now
            </button>
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="sticky top-[145px] z-40 bg-black/95 backdrop-blur-lg border-b border-gray-800 px-4 py-3">
          <div className="flex items-center justify-around text-center">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              <div>
                <div className="text-white font-bold">Live Now</div>
                <div className="text-xs text-gray-400">Playing today</div>
              </div>
            </div>
            <div className="h-8 w-px bg-gray-800" />
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-500" />
              <div>
                <div className="text-white font-bold">Find Players</div>
                <div className="text-xs text-gray-400">Near you</div>
              </div>
            </div>
            <div className="h-8 w-px bg-gray-800" />
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-teal-500" />
              <div>
                <div className="text-white font-bold">Book Courts</div>
                <div className="text-xs text-gray-400">In seconds</div>
              </div>
            </div>
          </div>
        </div>

        {/* Feed Posts */}
        <div className="divide-y divide-gray-800">
          {samplePosts.map((post) => (
            <article key={post.id} className="bg-black p-4 hover:bg-gray-900/50 transition-colors">
              {/* Post Header */}
              <div className="flex items-center gap-3 mb-3">
                <img
                  src={post.user_avatar}
                  alt={post.user_name}
                  className="w-12 h-12 rounded-full border-2 border-emerald-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white hover:underline cursor-pointer">
                      {post.user_name}
                    </span>
                    <span className="text-gray-500 text-sm">{post.time_ago}</span>
                  </div>
                  {post.location && (
                    <div className="flex items-center gap-1 text-gray-400 text-sm">
                      <MapPin className="w-3 h-3" />
                      <span>{post.location}</span>
                    </div>
                  )}
                </div>
                <button className="text-gray-400 hover:text-white transition-colors">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>

              {/* Post Content */}
              <p className="text-white mb-3 leading-relaxed">{post.content}</p>

              {/* Post Image */}
              <div className="relative rounded-2xl overflow-hidden mb-3 bg-gray-900">
                <img
                  src={post.image_url}
                  alt="Post content"
                  className="w-full aspect-video object-cover"
                />
              </div>

              {/* Post Actions */}
              <div className="flex items-center gap-6">
                <button className="flex items-center gap-2 text-gray-400 hover:text-red-500 transition-colors group">
                  <Heart className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  <span className="font-semibold">{post.likes}</span>
                </button>
                <button className="flex items-center gap-2 text-gray-400 hover:text-emerald-400 transition-colors group">
                  <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  <span className="font-semibold">{post.comments}</span>
                </button>
                <button className="flex items-center gap-2 text-gray-400 hover:text-teal-400 transition-colors group">
                  <Share2 className="w-6 h-6 group-hover:scale-110 transition-transform" />
                </button>
              </div>
            </article>
          ))}
        </div>

        {/* CTA Banner */}
        <div className="sticky bottom-0 bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-center">
          <h3 className="text-2xl font-bold text-white mb-2">
            Join the community
          </h3>
          <p className="text-white/90 mb-4">
            Connect with players, share your game, book courts
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => onAuthRequired('signup')}
              className="px-8 py-3 bg-white text-emerald-600 font-bold rounded-full hover:scale-105 transition-transform"
            >
              Sign up
            </button>
            <button
              onClick={() => onAuthRequired('login')}
              className="px-8 py-3 bg-transparent border-2 border-white text-white font-bold rounded-full hover:bg-white/10 transition-colors"
            >
              Log in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
