import React from 'react';
import { MapPin, Navigation, ExternalLink } from 'lucide-react';

interface InteractiveMapProps {
  address: string;
  city: string;
  state: string;
  facilityName: string;
}

export function InteractiveMap({ address, city, state, facilityName }: InteractiveMapProps) {
  const fullAddress = `${address}, ${city}, ${state}`;
  const encodedAddress = encodeURIComponent(fullAddress);
  const mapSrc = `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodedAddress}&zoom=15`;

  const openDirections = () => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`, '_blank');
  };

  const openInMaps = () => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
  };

  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-md">
          <MapPin className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Location</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Find us here</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-lg">
        <div className="relative h-64 md:h-80 bg-slate-200 dark:bg-slate-700">
          <iframe
            src={mapSrc}
            className="absolute inset-0 w-full h-full"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

        <div className="p-4">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0 shadow-sm">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-900 dark:text-white mb-1">{facilityName}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {address}<br />
                {city}, {state}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={openDirections}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all"
            >
              <Navigation className="w-4 h-4" />
              Directions
            </button>
            <button
              onClick={openInMaps}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-xl font-semibold transition-all"
            >
              <ExternalLink className="w-4 h-4" />
              Open Map
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
