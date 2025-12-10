import { X, Users, Calendar, CreditCard, Settings, Check } from 'lucide-react';

interface FamilyAccountDemoProps {
  onClose: () => void;
}

export function FamilyAccountDemo({ onClose }: FamilyAccountDemoProps) {
  const familyMembers = [
    { name: 'Sarah Johnson', role: 'Parent (Account Owner)', bookings: 12, status: 'active' },
    { name: 'Mike Johnson', role: 'Parent', bookings: 8, status: 'active' },
    { name: 'Emma Johnson', role: 'Child (16)', bookings: 15, status: 'active' },
    { name: 'Lucas Johnson', role: 'Child (14)', bookings: 10, status: 'active' },
  ];

  const upcomingBookings = [
    { member: 'Emma', court: 'Court 3', date: 'Dec 12', time: '4:00 PM', status: 'confirmed' },
    { member: 'Lucas', court: 'Court 1', date: 'Dec 13', time: '3:30 PM', status: 'confirmed' },
    { member: 'Sarah', court: 'Court 5', date: 'Dec 14', time: '10:00 AM', status: 'confirmed' },
    { member: 'Mike', court: 'Court 2', date: 'Dec 15', time: '6:00 PM', status: 'confirmed' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white p-4 sm:p-6 rounded-t-xl sm:rounded-t-2xl flex items-center justify-between">
          <div className="min-w-0 flex-1 pr-2">
            <div className="flex items-center gap-2 mb-1 sm:mb-2">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold truncate">Johnson Family Dashboard</h2>
            </div>
            <p className="text-emerald-100 text-xs sm:text-sm">Manage your entire family from one account</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 p-1.5 sm:p-2 rounded-lg transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        <div className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 md:space-y-8">
          <div className="bg-gradient-to-br from-emerald-50 to-white rounded-lg sm:rounded-xl p-4 sm:p-6 border border-emerald-100">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-800">Family Members</h3>
              <button className="bg-emerald-600 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold hover:bg-emerald-700 transition-colors">
                + Add Member
              </button>
            </div>
            <div className="grid md:grid-cols-2 gap-3 sm:gap-4">
              {familyMembers.map((member, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200 hover:border-emerald-300 transition-all"
                >
                  <div className="flex items-start justify-between mb-2 sm:mb-3">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-gray-800 text-sm sm:text-base truncate">{member.name}</h4>
                      <p className="text-xs sm:text-sm text-gray-600">{member.role}</p>
                    </div>
                    <div className="flex items-center gap-0.5 sm:gap-1 bg-emerald-100 text-emerald-700 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs font-semibold flex-shrink-0 ml-2">
                      <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      Active
                    </div>
                  </div>
                  <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                      {member.bookings} bookings
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
            <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-800">Upcoming Bookings</h3>
                <button className="text-emerald-600 text-xs sm:text-sm font-semibold hover:text-emerald-700">
                  View All
                </button>
              </div>
              <div className="space-y-2 sm:space-y-3">
                {upcomingBookings.map((booking, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                        <span className="font-bold text-gray-800 text-xs sm:text-sm">{booking.member}</span>
                        <span className="text-gray-400">•</span>
                        <span className="text-xs sm:text-sm text-gray-600 truncate">{booking.court}</span>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600">
                        {booking.date} at {booking.time}
                      </p>
                    </div>
                    <button className="text-emerald-600 text-xs sm:text-sm font-semibold hover:text-emerald-700 flex-shrink-0">
                      Manage
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4 sm:space-y-6">
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg sm:rounded-xl p-4 sm:p-6 text-white">
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <div className="bg-white/20 p-2 sm:p-3 rounded-lg">
                    <CreditCard className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base sm:text-lg font-bold truncate">Family Payment Method</h3>
                    <p className="text-emerald-100 text-xs sm:text-sm">Visa •••• 4242</p>
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-emerald-100 mb-1 sm:mb-2">This Month's Total</p>
                  <p className="text-2xl sm:text-3xl font-bold">$487.50</p>
                  <p className="text-xs sm:text-sm text-emerald-100 mt-1 sm:mt-2">45 bookings across all members</p>
                </div>
              </div>

              <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 border border-gray-200">
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <div className="bg-blue-100 p-2 sm:p-3 rounded-lg">
                    <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-800">Quick Actions</h3>
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <button className="w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-gray-700 font-medium text-xs sm:text-sm">
                    Book for any family member
                  </button>
                  <button className="w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-gray-700 font-medium text-xs sm:text-sm">
                    View family schedule
                  </button>
                  <button className="w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-gray-700 font-medium text-xs sm:text-sm">
                    Manage permissions
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-white rounded-lg sm:rounded-xl p-4 sm:p-6 border border-blue-100">
            <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4">Family Account Benefits</h3>
            <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
              <div className="flex gap-2 sm:gap-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-semibold text-gray-800 mb-0.5 sm:mb-1 text-xs sm:text-sm">Single Payment Method</h4>
                  <p className="text-xs sm:text-sm text-gray-600">One card for all family bookings</p>
                </div>
              </div>
              <div className="flex gap-2 sm:gap-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-semibold text-gray-800 mb-0.5 sm:mb-1 text-xs sm:text-sm">Unified Calendar</h4>
                  <p className="text-xs sm:text-sm text-gray-600">See everyone's schedule in one view</p>
                </div>
              </div>
              <div className="flex gap-2 sm:gap-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-semibold text-gray-800 mb-0.5 sm:mb-1 text-xs sm:text-sm">Simple Administration</h4>
                  <p className="text-xs sm:text-sm text-gray-600">Manage permissions and settings easily</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
