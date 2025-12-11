import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, MapPin, Building2, Search, Star } from 'lucide-react';
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
        <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-8 lg:py-12">
      <div className="hidden lg:block text-center mb-10 pb-10 border-b-2 border-slate-200 dark:border-slate-700">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 mb-6 shadow-xl">
          <Building2 className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-3">Discover Clubs</h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">Find and explore pickleball clubs in your area</p>
      </div>

      <div className="mb-8 space-y-5">
        <div className="relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search clubs by name or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-6 py-4 border-2 border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 text-base shadow-sm transition-all"
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all shadow-sm ${
              showFavoritesOnly
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border-2 border-slate-200 dark:border-slate-700'
            }`}
          >
            <Star className={`w-5 h-5 ${showFavoritesOnly ? 'fill-white' : ''}`} />
            <span className="hidden sm:inline">{showFavoritesOnly ? 'Favorites Only' : 'Show All Clubs'}</span>
            <span className="sm:hidden">{showFavoritesOnly ? 'Favorites' : 'All'}</span>
          </button>
          <div className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
              {filteredFacilities.length} {filteredFacilities.length === 1 ? 'club' : 'clubs'}
            </span>
          </div>
        </div>
      </div>

      {filteredFacilities.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-6">
            <Building2 className="w-10 h-10 text-slate-400 dark:text-slate-500" />
          </div>
          <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">No clubs found</h3>
          <p className="text-slate-500 dark:text-slate-400 text-lg">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredFacilities.map((facility) => (
            <div
              key={facility.id}
              className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-200 border border-slate-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-500 group overflow-hidden"
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(facility.id, facility.isFavorite || false);
                }}
                className="absolute top-4 right-4 z-10 p-2 rounded-lg bg-white/90 dark:bg-slate-700/90 backdrop-blur-sm hover:bg-white dark:hover:bg-slate-700 transition-all shadow-sm"
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
                className="w-full p-4 sm:p-6 text-left flex items-center gap-3 sm:gap-5"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-105 transition-transform duration-200 p-2">
                  {facility.logo_url ? (
                    <img
                      src={facility.logo_url}
                      alt={facility.name}
                      className="w-full h-full object-contain"
                      style={{ mixBlendMode: 'multiply' }}
                    />
                  ) : (
                    <Building2 className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400 dark:text-slate-500" />
                  )}
                </div>

                <div className="flex-1 min-w-0 pr-2 sm:pr-8">
                  <h2 className="text-base sm:text-xl font-bold text-slate-900 dark:text-white mb-1 sm:mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2">
                    {facility.name}
                  </h2>
                  {(facility.city || facility.state) && (
                    <div className="flex items-start gap-1.5 sm:gap-2 text-slate-600 dark:text-slate-400 mb-2">
                      <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 mt-0.5" />
                      <span className="text-sm sm:text-base font-medium line-clamp-2">
                        {[facility.city, facility.state].filter(Boolean).join(', ')}
                      </span>
                    </div>
                  )}
                  {facility.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed hidden sm:block">{facility.description}</p>
                  )}
                </div>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
