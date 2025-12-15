import React, { useState, useEffect } from 'react';
import {
  ParkingSquare, Wifi, ShoppingBag, DoorClosed, Droplet,
  Utensils, Package, UserCircle, Trophy, Sun, Home, Lightbulb,
  Sparkles
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Amenity {
  id: string;
  name: string;
  icon: string;
  category: string;
  display_order: number;
}

interface AmenitiesShowcaseProps {
  facilityId: string;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'parking-square': ParkingSquare,
  'wifi': Wifi,
  'shopping-bag': ShoppingBag,
  'door-closed': DoorClosed,
  'droplet': Droplet,
  'utensils': Utensils,
  'package': Package,
  'user-circle': UserCircle,
  'trophy': Trophy,
  'sun': Sun,
  'home': Home,
  'lightbulb': Lightbulb,
};

const categoryColors: Record<string, string> = {
  parking: 'from-blue-500 to-blue-600',
  connectivity: 'from-purple-500 to-purple-600',
  amenities: 'from-emerald-500 to-emerald-600',
  facilities: 'from-cyan-500 to-cyan-600',
  services: 'from-orange-500 to-orange-600',
  activities: 'from-yellow-500 to-yellow-600',
  courts: 'from-teal-500 to-teal-600',
};

export function AmenitiesShowcase({ facilityId }: AmenitiesShowcaseProps) {
  const [amenities, setAmenities] = useState<Amenity[]>([]);

  useEffect(() => {
    loadAmenities();
  }, [facilityId]);

  const loadAmenities = async () => {
    const { data } = await supabase
      .from('facility_amenities')
      .select('*')
      .eq('facility_id', facilityId)
      .order('display_order');

    if (data) {
      setAmenities(data);
    }
  };

  if (amenities.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-md">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Amenities & Features</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Everything you need for a great experience</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {amenities.map((amenity) => {
          const Icon = iconMap[amenity.icon] || Package;
          const colorClass = categoryColors[amenity.category] || 'from-slate-500 to-slate-600';

          return (
            <div
              key={amenity.id}
              className="group bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all hover:shadow-lg hover:-translate-y-1"
            >
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colorClass} flex items-center justify-center mb-3 mx-auto group-hover:scale-110 transition-transform shadow-md`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-xs font-semibold text-center text-slate-700 dark:text-slate-300 leading-tight">
                {amenity.name}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
