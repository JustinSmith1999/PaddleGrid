import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, MapPin, Building2, ArrowRight, Search, Star } from 'lucide-react';
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
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Browse Clubs</h2>
        <p className="text-gray-600">Search and explore pickleball clubs</p>
      </div>

        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search clubs by name or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white shadow-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                showFavoritesOnly
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Star className={`w-4 h-4 ${showFavoritesOnly ? 'fill-emerald-600' : ''}`} />
              {showFavoritesOnly ? 'Favorites Only' : 'Show All'}
            </button>
            <span className="text-sm text-gray-500">
              {filteredFacilities.length} {filteredFacilities.length === 1 ? 'club' : 'clubs'}
            </span>
          </div>
        </div>

        {filteredFacilities.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-lg border border-gray-100">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No clubs found</h3>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredFacilities.map((facility) => (
              <div
                key={facility.id}
                className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-200 p-6 border border-gray-100 hover:border-emerald-300 group relative"
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(facility.id, facility.isFavorite || false);
                  }}
                  className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors z-10"
                  title={facility.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Star
                    className={`w-5 h-5 transition-colors ${
                      facility.isFavorite
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-400 hover:text-yellow-400'
                    }`}
                  />
                </button>

                <button
                  onClick={() => navigate(`/club/${facility.slug}`)}
                  className="w-full text-left"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center flex-shrink-0">
                      {facility.logo_url ? (
                        <img
                          src={facility.logo_url}
                          alt={facility.name}
                          className="w-full h-full object-cover rounded-xl"
                        />
                      ) : (
                        <Building2 className="w-8 h-8 text-emerald-600" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 pr-8">
                      <h3 className="text-lg font-bold text-gray-800 mb-1 group-hover:text-emerald-600 transition-colors">
                        {facility.name}
                      </h3>
                      {(facility.city || facility.state) && (
                        <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
                          <MapPin className="w-4 h-4" />
                          <span>
                            {[facility.city, facility.state].filter(Boolean).join(', ')}
                          </span>
                        </div>
                      )}
                      {facility.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">{facility.description}</p>
                      )}
                    </div>

                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
                  </div>
                </button>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}
