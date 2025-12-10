import { useState, useEffect } from 'react';
import { X, Clock, CreditCard, CheckCircle } from 'lucide-react';

interface ThreeClickCheckoutProps {
  onClose: () => void;
}

export function ThreeClickCheckout({ onClose }: ThreeClickCheckoutProps) {
  const [step, setStep] = useState(1);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [selectedCourt, setSelectedCourt] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 100);

    return () => clearInterval(interval);
  }, [startTime]);

  const courts = ['Court 1', 'Court 2', 'Court 3', 'Court 4'];
  const times = ['9:00 AM', '10:00 AM', '11:00 AM', '2:00 PM', '3:00 PM', '4:00 PM'];

  const handleCourtSelect = (court: string) => {
    setSelectedCourt(court);
    setStep(2);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setStep(3);
  };

  const handlePayment = () => {
    setStep(4);
    setTimeout(() => {
      onClose();
    }, 2000);
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

        {/* Timer */}
        <div className="flex items-center justify-center mb-4 sm:mb-6">
          <div className="bg-emerald-100 rounded-full px-3 py-1.5 sm:px-4 sm:py-2 flex items-center space-x-1.5 sm:space-x-2">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
            <span className="font-bold text-emerald-800 text-sm sm:text-base">
              {elapsedTime}s elapsed
            </span>
            <span className="text-emerald-600 text-xs sm:text-sm">
              (Target: &lt;15s)
            </span>
          </div>
        </div>

        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-1 sm:mb-2 text-center px-8">
          3-Click Checkout Demo
        </h2>
        <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 md:mb-8 text-center">
          Experience the fastest booking flow in the industry
        </p>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-4 sm:mb-6 md:mb-8">
          {[1, 2, 3].map((num) => (
            <div key={num} className="flex items-center">
              <div
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-sm sm:text-base ${
                  step >= num
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {step > num ? <CheckCircle className="w-4 h-4 sm:w-6 sm:h-6" /> : num}
              </div>
              {num < 3 && (
                <div
                  className={`w-8 sm:w-12 md:w-16 h-1 mx-1 sm:mx-2 ${
                    step > num ? 'bg-emerald-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        {step === 1 && (
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4 text-center">
              Click 1: Choose Your Court
            </h3>
            <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4">
              {courts.map((court) => (
                <button
                  key={court}
                  onClick={() => handleCourtSelect(court)}
                  className="p-3 sm:p-4 border-2 border-gray-200 rounded-lg sm:rounded-xl hover:border-emerald-500 hover:bg-emerald-50 transition-all text-left"
                >
                  <div className="font-semibold text-gray-800 text-sm sm:text-base">{court}</div>
                  <div className="text-xs sm:text-sm text-gray-600">$35/hour</div>
                  <div className="text-xs text-green-600 mt-1">Available Now</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4 text-center">
              Click 2: Pick Your Time
            </h3>
            <div className="mb-3 sm:mb-4 text-center">
              <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs sm:text-sm font-semibold">
                {selectedCourt} Selected
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
              {times.map((time) => (
                <button
                  key={time}
                  onClick={() => handleTimeSelect(time)}
                  className="p-2.5 sm:p-3 border-2 border-gray-200 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition-all font-semibold text-gray-800 text-sm sm:text-base"
                >
                  {time}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4 text-center">
              Click 3: Confirm & Pay
            </h3>
            <div className="bg-gray-50 rounded-lg sm:rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
              <div className="flex justify-between items-center mb-2 text-sm sm:text-base">
                <span className="text-gray-600">Court:</span>
                <span className="font-semibold">{selectedCourt}</span>
              </div>
              <div className="flex justify-between items-center mb-2 text-sm sm:text-base">
                <span className="text-gray-600">Time:</span>
                <span className="font-semibold">{selectedTime}</span>
              </div>
              <div className="flex justify-between items-center mb-2 text-sm sm:text-base">
                <span className="text-gray-600">Duration:</span>
                <span className="font-semibold">1 hour</span>
              </div>
              <div className="border-t border-gray-200 pt-2 mt-3 sm:mt-4">
                <div className="flex justify-between items-center">
                  <span className="text-base sm:text-lg font-bold">Total:</span>
                  <span className="text-xl sm:text-2xl font-bold text-emerald-600">$35.00</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Platform fee: $0.35 (1% - not hidden!)
                </div>
              </div>
            </div>
            <button
              onClick={handlePayment}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 sm:py-4 rounded-lg sm:rounded-xl transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base"
            >
              <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Complete Booking</span>
            </button>
          </div>
        )}

        {step === 4 && (
          <div className="text-center">
            <CheckCircle className="w-12 h-12 sm:w-16 sm:h-16 text-green-500 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
              Booking Confirmed!
            </h3>
            <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
              Total time: <span className="font-bold text-emerald-600">{elapsedTime}s</span>
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
              <p className="text-green-800 font-semibold text-sm sm:text-base">
                ✅ 3 clicks, {elapsedTime} seconds - faster than any competitor!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}