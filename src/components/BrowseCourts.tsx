import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, MapPin, Building2, Search, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Facility {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  logo_url: string | null;
  isFavorite?: boolean;
}

export function BrowseCourts() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  useEffect(() => {
    fetchFacilities();
  }, [user]);

  const fetchFacilities = async () => {
    setLoading(true);
    try {
      const { data: facilitiesData, error } = await supabase
        .from('facilities')
        .select('id, name, slug, description, address, city, state, logo_url')
        .order('name');

      if (error) throw error;

      let facilities = facilitiesData || [];

      if (user) {
        const { data: favoritesData } = await supabase
          .from('favorite_facilities')
          .select('facility_id')
          .eq('user_id', user.id);

        const favoriteIds = new Set(favoritesData?.map(f => f.facility_id) || []);

        facilities = facilities.map(facility => ({
          ...facility,
          isFavorite: favoriteIds.has(facility.id)
        }));

        facilities.sort((a, b) => {
          if (a.isFavorite && !b.isFavorite) return -1;
          if (!a.isFavorite && b.isFavorite) return 1;
          return 0;
        });
      }

      setFacilities(facilities);
    } catch (error) {
      console.error('Error fetching facilities:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (facilityId: string, currentState: boolean) => {
    if (!user) {
      alert('Please sign in to favorite clubs');
      return;
    }

    try {
      if (currentState) {
        await supabase
          .from('favorite_facilities')
          .delete()
          .eq('user_id', user.id)
          .eq('facility_id', facilityId);
      } else {
        await supabase
          .from('favorite_facilities')
          .insert({ user_id: user.id, facility_id: facilityId });
      }

      setFacilities(prev =>
        prev.map(f =>
          f.id === facilityId ? { ...f, isFavorite: !currentState } : f
        ).sort((a, b) => {
          if (a.isFavorite && !b.isFavorite) return -1;
          if (!a.isFavorite && b.isFavorite) return 1;
          return 0;
        })
      );
    } catch (error) {
      console.error('Error toggling favorite:', error);
      alert('Failed to update favorite');
    }
  };

  const filteredFacilities = facilities.filter(facility => {
    const matchesSearch = facility.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      facility.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      facility.state?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFavorites = !showFavoritesOnly || facility.isFavorite;

    return matchesSearch && matchesFavorites;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-12 h-12 text-green-700 animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-6 pt-2 pb-8 lg:py-12">
      <div className="hidden lg:block text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-700 mb-6 shadow-xl">
          <Building2 className="w-8 h-8 text-white" />
        </div>
        <h1
          className="text-2xl font-bold text-slate-900 mb-3"
        >
          Discover Clubs
        </h1>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto">Find and explore pickleball clubs in your area</p>
      </div>

      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
          <input
            type="text"
            placeholder="Search clubs by name or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 text-slate-900 placeholder-slate-400 transition-all outline-none"
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              showFavoritesOnly
                ? 'bg-green-700 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-sm'
            }`}
          >
            <Star className={`w-4 h-4 ${showFavoritesOnly ? 'fill-white' : ''}`} />
            <span className="hidden sm:inline">{showFavoritesOnly ? 'Favorites Only' : 'Show All Clubs'}</span>
            <span className="sm:hidden">{showFavoritesOnly ? 'Favorites' : 'All'}</span>
          </button>
          <div className="bg-green-50 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-lg">
            {filteredFacilities.length} {filteredFacilities.length === 1 ? 'club' : 'clubs'}
          </div>
        </div>
      </div>

      {filteredFacilities.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-slate-100">
          <div className="w-20 h-20 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-6">
            <Building2 className="w-10 h-10 text-green-700" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2">No clubs found</h3>
          <p className="text-sm text-slate-500 text-lg">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredFacilities.map((facility, index) => (
            <motion.div
              key={facility.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="relative bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden group"
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(facility.id, facility.isFavorite || false);
                }}
                className="absolute top-4 right-4 z-10 p-2 rounded-lg bg-white/90 backdrop-blur-sm hover:bg-white transition-all shadow-sm"
                title={facility.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Star
                  className={`w-5 h-5 transition-all ${
                    facility.isFavorite
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-slate-400 hover:text-yellow-400'
                  }`}
                />
              </button>

              <button
                onClick={() => navigate(`/club/${facility.slug}`)}
                className="w-full p-4 sm:p-5 text-left flex items-center gap-3 sm:gap-4"
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-white flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-105 transition-transform duration-200 p-2 border border-slate-100">
                  {facility.logo_url ? (
                    <img
                      src={facility.logo_url}
                      alt={facility.name}
                      className="w-full h-full object-contain"
                      style={{ mixBlendMode: 'multiply' }}
                    />
                  ) : (
                    <Building2 className="w-7 h-7 sm:w-8 sm:h-8 text-slate-400" />
                  )}
                </div>

                <div className="flex-1 min-w-0 pr-2 sm:pr-8">
                  <h2 className="text-base font-bold text-slate-900 group-hover:text-green-700 transition-colors">
                    {facility.name}
                  </h2>
                  {(facility.city || facility.state) && (
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-sm text-slate-500 font-medium">
                        {[facility.city, facility.state].filter(Boolean).join(', ')}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex-shrink-0 hidden sm:block">
                  <span className="bg-green-700 hover:bg-green-800 text-white text-sm font-semibold rounded-xl px-4 py-2.5 transition-colors">
                    View
                  </span>
                </div>
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
