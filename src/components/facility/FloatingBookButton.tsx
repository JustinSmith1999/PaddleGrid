import React, { useState, useEffect } from 'react';
import { Calendar, Clock } from 'lucide-react';

interface FloatingBookButtonProps {
  nextAvailableTime: string | null;
  onClick: () => void;
}

export function FloatingBookButton({ nextAvailableTime, onClick }: FloatingBookButtonProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 300;
      setIsVisible(scrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <button
      onClick={onClick}
      className={`fixed bottom-6 right-6 z-50 group transition-all duration-300 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'
      }`}
    >
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl animate-pulse blur-lg opacity-75" />

        <div className="relative bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl shadow-2xl hover:shadow-emerald-500/50 transition-all px-6 py-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center animate-bounce">
            <Calendar className="w-6 h-6" />
          </div>

          <div className="text-left">
            <p className="text-sm font-semibold text-white/90">Book a Court</p>
            {nextAvailableTime && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <Clock className="w-3.5 h-3.5 text-white/80" />
                <p className="text-xs font-bold text-white">{nextAvailableTime}</p>
              </div>
            )}
            {!nextAvailableTime && (
              <p className="text-xs font-medium text-white/80 mt-0.5">View Schedule</p>
            )}
          </div>
        </div>

        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-ping" />
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white" />
      </div>
    </button>
  );
}
