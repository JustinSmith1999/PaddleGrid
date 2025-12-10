import { useState, useEffect } from 'react';
import { X, Clock, Users, CheckCircle, Phone, MessageSquare } from 'lucide-react';

interface WaitlistManagerProps {
  onClose: () => void;
}

export function WaitlistManager({ onClose }: WaitlistManagerProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [timeLeft, setTimeLeft] = useState(30);
  const [position, setPosition] = useState(1);

  useEffect(() => {
    if (currentStep === 2 && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setCurrentStep(3);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [currentStep, timeLeft]);

  const handleJoinWaitlist = () => {
    setCurrentStep(2);
  };

  const handleClaimSlot = () => {
    setCurrentStep(4);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-2xl w-full p-4 sm:p-6 md:p-8 relative max-h-[95vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 sm:top-4 sm:right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
        >
          <X className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        <div className="text-center mb-4 sm:mb-6 md:mb-8">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-2 px-6">
            Auto Wait-List Demo
          </h2>
          <p className="text-sm sm:text-base text-gray-600">
            See how we eliminate front desk calls with automated notifications
          </p>
        </div>

        {/* Step 1: Court Full */}
        {currentStep === 1 && (
          <div className="text-center">
            <div className="bg-red-100 rounded-full w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <Users className="w-8 h-8 sm:w-10 sm:h-10 text-red-600" />
            </div>
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 mb-3 sm:mb-4">
              Court 1 - 2:00 PM is Full
            </h3>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
              This time slot is currently booked, but you can join the waitlist for automatic notifications.
            </p>

            <div className="bg-gray-50 rounded-lg sm:rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
              <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                <div>
                  <span className="text-gray-500">Current booking:</span>
                  <div className="font-semibold">John Smith</div>
                </div>
                <div>
                  <span className="text-gray-500">Ends at:</span>
                  <div className="font-semibold">3:00 PM</div>
                </div>
              </div>
            </div>

            <button
              onClick={handleJoinWaitlist}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 sm:py-4 rounded-lg sm:rounded-xl transition-colors mb-3 sm:mb-4 text-sm sm:text-base"
            >
              Join Waitlist (Position #1)
            </button>

            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 sm:p-4">
              <p className="text-emerald-800 text-xs sm:text-sm font-semibold">
                ✅ 0 front desk calls needed - fully automated!
              </p>
            </div>
          </div>
        )}

        {/* Step 2: On Waitlist */}
        {currentStep === 2 && (
          <div className="text-center">
            <div className="bg-blue-100 rounded-full w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <Clock className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600" />
            </div>
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 mb-3 sm:mb-4">
              You're on the Waitlist!
            </h3>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
              We'll notify you instantly when a slot opens. No need to call or check back.
            </p>

            <div className="bg-blue-50 rounded-lg sm:rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
              <div className="text-2xl sm:text-3xl font-bold text-blue-600 mb-2">#{position}</div>
              <div className="text-blue-800 font-semibold text-sm sm:text-base">Your Position</div>
              <div className="text-blue-600 text-xs sm:text-sm mt-2">
                Average wait time: 15 minutes
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
              <p className="text-yellow-800 text-xs sm:text-sm">
                🔔 Simulating slot opening in {timeLeft} seconds...
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600">
              <div className="bg-gray-50 rounded-lg p-2.5 sm:p-3">
                <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 mx-auto mb-2 text-gray-500" />
                <div className="font-semibold">SMS Alert</div>
                <div>Instant notification</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-2.5 sm:p-3">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 mx-auto mb-2 text-gray-500" />
                <div className="font-semibold">30s to Claim</div>
                <div>Quick response window</div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Slot Available */}
        {currentStep === 3 && (
          <div className="text-center">
            <div className="bg-green-100 rounded-full w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mx-auto mb-4 sm:mb-6 animate-pulse">
              <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" />
            </div>
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 mb-3 sm:mb-4">
              Slot Available!
            </h3>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
              Court 1 - 2:00 PM just opened up. You have 30 seconds to claim it.
            </p>

            <div className="bg-green-50 border-2 border-green-200 rounded-lg sm:rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
              <div className="flex items-center justify-center space-x-3 sm:space-x-4 mb-3 sm:mb-4">
                <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                <span className="font-semibold text-green-800 text-sm sm:text-base">SMS Sent!</span>
              </div>
              <div className="text-xs sm:text-sm text-green-700 bg-white rounded-lg p-2.5 sm:p-3">
                "🎾 Court 1 at 2:00 PM is now available! Claim your spot: [link] - Expires in 30s"
              </div>
            </div>

            <button
              onClick={handleClaimSlot}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 sm:py-4 rounded-lg sm:rounded-xl transition-colors mb-3 sm:mb-4 animate-pulse text-sm sm:text-base"
            >
              Claim Slot Now!
            </button>

            <div className="text-xs sm:text-sm text-gray-500">
              ⏱️ 30 seconds to respond (industry-leading speed)
            </div>
          </div>
        )}

        {/* Step 4: Success */}
        {currentStep === 4 && (
          <div className="text-center">
            <div className="bg-green-100 rounded-full w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" />
            </div>
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 mb-3 sm:mb-4">
              Booking Confirmed!
            </h3>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
              Court 1 - 2:00 PM is now yours. Payment processed automatically.
            </p>

            <div className="bg-green-50 rounded-lg sm:rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
              <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                <div>
                  <span className="text-green-600">Response time:</span>
                  <div className="font-bold text-green-800">8 seconds</div>
                </div>
                <div>
                  <span className="text-green-600">Success rate:</span>
                  <div className="font-bold text-green-800">94%</div>
                </div>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 sm:p-6">
              <h4 className="font-bold text-emerald-800 mb-2 sm:mb-3 text-sm sm:text-base">Why This Beats Competitors:</h4>
              <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-emerald-700 text-left">
                <div className="flex items-center">
                  <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                  <span>0 front desk calls (vs 3-5 with competitors)</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                  <span>30-second response window (vs manual callbacks)</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                  <span>94% success rate (vs 60% with phone calls)</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                  <span>Saves 2+ hours of staff time daily</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}