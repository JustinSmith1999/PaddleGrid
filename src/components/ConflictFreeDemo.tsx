import { X, Calendar, Check, AlertCircle, Sparkles } from 'lucide-react';

interface ConflictFreeDemoProps {
  onClose: () => void;
}

export function ConflictFreeDemo({ onClose }: ConflictFreeDemoProps) {
  const timeSlots = [
    { time: '9:00 AM', courts: [
      { id: 1, status: 'available', price: 45 },
      { id: 2, status: 'booked', bookedBy: 'John D.' },
      { id: 3, status: 'available', price: 45 },
      { id: 4, status: 'available', price: 45 },
    ]},
    { time: '10:00 AM', courts: [
      { id: 1, status: 'booked', bookedBy: 'Sarah M.' },
      { id: 2, status: 'available', price: 45 },
      { id: 3, status: 'suggested', price: 45, reason: 'High demand slot' },
      { id: 4, status: 'booked', bookedBy: 'Mike R.' },
    ]},
    { time: '11:00 AM', courts: [
      { id: 1, status: 'available', price: 45 },
      { id: 2, status: 'available', price: 45 },
      { id: 3, status: 'booked', bookedBy: 'Emma L.' },
      { id: 4, status: 'available', price: 45 },
    ]},
    { time: '12:00 PM', courts: [
      { id: 1, status: 'suggested', price: 50, reason: 'Peak time pricing' },
      { id: 2, status: 'booked', bookedBy: 'Lisa K.' },
      { id: 3, status: 'available', price: 50 },
      { id: 4, status: 'suggested', price: 50, reason: 'Peak time pricing' },
    ]},
    { time: '1:00 PM', courts: [
      { id: 1, status: 'booked', bookedBy: 'Tom W.' },
      { id: 2, status: 'available', price: 50 },
      { id: 3, status: 'available', price: 50 },
      { id: 4, status: 'booked', bookedBy: 'Anna P.' },
    ]},
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white p-4 sm:p-6 rounded-t-xl sm:rounded-t-2xl flex items-center justify-between">
          <div className="min-w-0 flex-1 pr-2">
            <div className="flex items-center gap-2 mb-1 sm:mb-2">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold">Conflict-Free Scheduling</h2>
            </div>
            <p className="text-emerald-100 text-xs sm:text-sm">AI-powered allocation prevents double bookings</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 p-1.5 sm:p-2 rounded-lg transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        <div className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
          <div className="bg-gradient-to-br from-emerald-50 to-white rounded-lg sm:rounded-xl p-4 sm:p-6 border border-emerald-100">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className="bg-emerald-100 p-1.5 sm:p-2 rounded-lg flex-shrink-0">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-gray-800 text-sm sm:text-base">Smart Booking Engine</h3>
                <p className="text-xs sm:text-sm text-gray-600">Real-time availability with intelligent suggestions</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-emerald-100 border-2 border-emerald-500 rounded flex-shrink-0"></div>
                <span className="text-gray-700">Available</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-200 border-2 border-gray-400 rounded flex-shrink-0"></div>
                <span className="text-gray-700">Booked</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-blue-100 border-2 border-blue-500 rounded flex-shrink-0"></div>
                <span className="text-gray-700">AI Suggested</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg sm:rounded-xl border border-gray-200 overflow-x-auto">
            <div className="min-w-[640px]">
              <div className="grid grid-cols-5 bg-gray-50 border-b border-gray-200">
                <div className="p-2 sm:p-3 md:p-4 font-semibold text-gray-700 border-r border-gray-200 text-xs sm:text-sm">Time</div>
                <div className="p-2 sm:p-3 md:p-4 font-semibold text-gray-700 text-center border-r border-gray-200 text-xs sm:text-sm">Court 1</div>
                <div className="p-2 sm:p-3 md:p-4 font-semibold text-gray-700 text-center border-r border-gray-200 text-xs sm:text-sm">Court 2</div>
                <div className="p-2 sm:p-3 md:p-4 font-semibold text-gray-700 text-center border-r border-gray-200 text-xs sm:text-sm">Court 3</div>
                <div className="p-2 sm:p-3 md:p-4 font-semibold text-gray-700 text-center text-xs sm:text-sm">Court 4</div>
              </div>
              {timeSlots.map((slot, slotIndex) => (
                <div key={slotIndex} className="grid grid-cols-5 border-b border-gray-200 last:border-b-0">
                  <div className="p-2 sm:p-3 md:p-4 font-medium text-gray-700 border-r border-gray-200 flex items-center text-xs sm:text-sm">
                    {slot.time}
                  </div>
                  {slot.courts.map((court, courtIndex) => (
                    <div
                      key={courtIndex}
                      className={`p-2 sm:p-3 md:p-4 border-r last:border-r-0 border-gray-200 ${
                        court.status === 'available'
                          ? 'bg-emerald-50 hover:bg-emerald-100 cursor-pointer'
                          : court.status === 'suggested'
                          ? 'bg-blue-50 hover:bg-blue-100 cursor-pointer'
                          : 'bg-gray-100'
                      } transition-colors`}
                    >
                      {court.status === 'available' && (
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-0.5 sm:gap-1 mb-0.5 sm:mb-1">
                            <Check className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-600" />
                            <span className="text-xs sm:text-sm font-semibold text-emerald-600">Available</span>
                          </div>
                          <p className="text-base sm:text-lg font-bold text-gray-800">${court.price}</p>
                        </div>
                      )}
                      {court.status === 'suggested' && (
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-0.5 sm:gap-1 mb-0.5 sm:mb-1">
                            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                            <span className="text-xs font-semibold text-blue-600">Suggested</span>
                          </div>
                          <p className="text-base sm:text-lg font-bold text-gray-800">${court.price}</p>
                          <p className="text-xs text-gray-600 mt-0.5 sm:mt-1">{court.reason}</p>
                        </div>
                      )}
                      {court.status === 'booked' && (
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-0.5 sm:gap-1 mb-0.5 sm:mb-1">
                            <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
                            <span className="text-xs sm:text-sm font-semibold text-gray-500">Booked</span>
                          </div>
                          <p className="text-xs text-gray-600">{court.bookedBy}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg sm:rounded-xl p-4 sm:p-6 text-white">
              <div className="bg-white/20 w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
                <Check className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="text-base sm:text-lg font-bold mb-1 sm:mb-2">Zero Conflicts</h3>
              <p className="text-emerald-100 text-xs sm:text-sm">
                Real-time locking prevents double bookings at the database level
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg sm:rounded-xl p-4 sm:p-6 text-white">
              <div className="bg-white/20 w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="text-base sm:text-lg font-bold mb-1 sm:mb-2">Smart Suggestions</h3>
              <p className="text-blue-100 text-xs sm:text-sm">
                AI analyzes patterns to recommend optimal booking times
              </p>
            </div>

            <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg sm:rounded-xl p-4 sm:p-6 text-white">
              <div className="bg-white/20 w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="text-base sm:text-lg font-bold mb-1 sm:mb-2">Maximize Revenue</h3>
              <p className="text-cyan-100 text-xs sm:text-sm">
                Dynamic pricing and utilization optimization increase earnings
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-50 to-white rounded-lg sm:rounded-xl p-4 sm:p-6 border border-gray-200">
            <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4">How It Works</h3>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex gap-3 sm:gap-4">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0 text-sm sm:text-base">
                  1
                </div>
                <div className="min-w-0">
                  <h4 className="font-semibold text-gray-800 mb-0.5 sm:mb-1 text-xs sm:text-sm">Real-Time Availability</h4>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Calendar updates instantly as bookings are made across all devices
                  </p>
                </div>
              </div>
              <div className="flex gap-3 sm:gap-4">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0 text-sm sm:text-base">
                  2
                </div>
                <div className="min-w-0">
                  <h4 className="font-semibold text-gray-800 mb-0.5 sm:mb-1 text-xs sm:text-sm">Conflict Prevention</h4>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Database-level locking ensures only one person can book each slot
                  </p>
                </div>
              </div>
              <div className="flex gap-3 sm:gap-4">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0 text-sm sm:text-base">
                  3
                </div>
                <div className="min-w-0">
                  <h4 className="font-semibold text-gray-800 mb-0.5 sm:mb-1 text-xs sm:text-sm">Smart Optimization</h4>
                  <p className="text-xs sm:text-sm text-gray-600">
                    AI suggests best times based on demand patterns and pricing
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
