import { useState } from 'react';
import { X, Calculator, DollarSign, TrendingUp } from 'lucide-react';

interface TransparentPricingProps {
  onClose: () => void;
}

export function TransparentPricing({ onClose }: TransparentPricingProps) {
  const [monthlyRevenue, setMonthlyRevenue] = useState(10000);

  const ourFee = 0.01; // 1%
  const competitorFee = 0.025; // 2.5%

  const ourMonthlyCost = monthlyRevenue * ourFee;
  const competitorMonthlyCost = monthlyRevenue * competitorFee;
  const monthlySavings = competitorMonthlyCost - ourMonthlyCost;
  const annualSavings = monthlySavings * 12;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-4xl w-full p-4 sm:p-6 md:p-8 relative max-h-[95vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 sm:top-4 sm:right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
        >
          <X className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        <div className="text-center mb-4 sm:mb-6 md:mb-8">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-2 px-6">
            Transparent Pricing Calculator
          </h2>
          <p className="text-sm sm:text-base text-gray-600">
            See exactly how much you save with our 1% cap vs competitors' hidden 2-3% fees
          </p>
        </div>

        {/* Revenue Input */}
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 md:mb-8 border border-emerald-200">
          <div className="flex items-center justify-center mb-3 sm:mb-4">
            <Calculator className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 mr-2" />
            <h3 className="text-base sm:text-lg md:text-xl font-bold text-emerald-800">Your Monthly Revenue</h3>
          </div>
          <div className="flex items-center justify-center space-x-2 sm:space-x-4">
            <span className="text-emerald-700 font-semibold text-sm sm:text-base">$</span>
            <input
              type="number"
              value={monthlyRevenue}
              onChange={(e) => setMonthlyRevenue(Number(e.target.value))}
              className="text-xl sm:text-2xl md:text-3xl font-bold text-center bg-white border-2 border-emerald-300 rounded-lg px-3 sm:px-4 py-1.5 sm:py-2 w-32 sm:w-40 md:w-48 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
            <span className="text-emerald-700 font-semibold text-sm sm:text-base">/month</span>
          </div>
        </div>

        {/* Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6 md:mb-8">
          {/* Competitor */}
          <div className="bg-red-50 border-2 border-red-200 rounded-xl sm:rounded-2xl p-4 sm:p-6">
            <div className="text-center mb-3 sm:mb-4">
              <h3 className="text-lg sm:text-xl font-bold text-red-800 mb-2">Competitor</h3>
              <div className="bg-red-100 rounded-lg px-3 py-1 inline-block">
                <span className="text-red-700 font-semibold text-xs sm:text-sm">2.5% Hidden Fee</span>
              </div>
            </div>
            <div className="space-y-2 sm:space-y-3">
              <div className="flex justify-between text-sm sm:text-base">
                <span className="text-red-700">Monthly Cost:</span>
                <span className="font-bold text-red-800">${competitorMonthlyCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm sm:text-base">
                <span className="text-red-700">Annual Cost:</span>
                <span className="font-bold text-red-800">${(competitorMonthlyCost * 12).toFixed(2)}</span>
              </div>
              <div className="bg-red-100 rounded-lg p-2.5 sm:p-3 mt-3 sm:mt-4">
                <p className="text-red-800 text-xs sm:text-sm font-semibold">
                  ⚠️ Fee often hidden in "processing costs"
                </p>
              </div>
            </div>
          </div>

          {/* PaddleGrid */}
          <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl sm:rounded-2xl p-4 sm:p-6">
            <div className="text-center mb-3 sm:mb-4">
              <h3 className="text-lg sm:text-xl font-bold text-emerald-800 mb-2">PaddleGrid</h3>
              <div className="bg-emerald-100 rounded-lg px-3 py-1 inline-block">
                <span className="text-emerald-700 font-semibold text-xs sm:text-sm">1% Transparent Cap</span>
              </div>
            </div>
            <div className="space-y-2 sm:space-y-3">
              <div className="flex justify-between text-sm sm:text-base">
                <span className="text-emerald-700">Monthly Cost:</span>
                <span className="font-bold text-emerald-800">${ourMonthlyCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm sm:text-base">
                <span className="text-emerald-700">Annual Cost:</span>
                <span className="font-bold text-emerald-800">${(ourMonthlyCost * 12).toFixed(2)}</span>
              </div>
              <div className="bg-emerald-100 rounded-lg p-2.5 sm:p-3 mt-3 sm:mt-4">
                <p className="text-emerald-800 text-xs sm:text-sm font-semibold">
                  ✅ Always shown upfront, never hidden
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Savings Highlight */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 mb-4 sm:mb-6 md:mb-8">
          <div className="text-center">
            <TrendingUp className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4">Your Savings with PaddleGrid</h3>
            <div className="grid grid-cols-2 gap-4 sm:gap-6">
              <div>
                <div className="text-2xl sm:text-3xl font-bold">${monthlySavings.toFixed(2)}</div>
                <div className="text-green-100 text-xs sm:text-sm">per month</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold">${annualSavings.toFixed(2)}</div>
                <div className="text-green-100 text-xs sm:text-sm">per year</div>
              </div>
            </div>
          </div>
        </div>

        {/* What You Can Buy */}
        <div className="bg-gray-50 rounded-xl sm:rounded-2xl p-4 sm:p-6">
          <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 mb-3 sm:mb-4 text-center">
            What You Can Buy with ${annualSavings.toFixed(0)} Annual Savings:
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-white rounded-lg p-3 sm:p-4 text-center">
              <div className="text-xl sm:text-2xl mb-1 sm:mb-2">🎾</div>
              <div className="font-semibold text-sm sm:text-base">New Equipment</div>
              <div className="text-xs sm:text-sm text-gray-600">Professional ball machines</div>
            </div>
            <div className="bg-white rounded-lg p-3 sm:p-4 text-center">
              <div className="text-xl sm:text-2xl mb-1 sm:mb-2">📱</div>
              <div className="font-semibold text-sm sm:text-base">Marketing Budget</div>
              <div className="text-xs sm:text-sm text-gray-600">Digital advertising campaigns</div>
            </div>
            <div className="bg-white rounded-lg p-3 sm:p-4 text-center">
              <div className="text-xl sm:text-2xl mb-1 sm:mb-2">👨‍💼</div>
              <div className="font-semibold text-sm sm:text-base">Staff Training</div>
              <div className="text-xs sm:text-sm text-gray-600">Professional development</div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-4 sm:mt-6 md:mt-8">
          <button
            onClick={onClose}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 sm:py-3 px-6 sm:px-8 rounded-lg sm:rounded-xl transition-colors text-sm sm:text-base"
          >
            Start Saving Today
          </button>
          <p className="text-gray-500 text-xs sm:text-sm mt-2">
            Switch to transparent pricing in under 24 hours
          </p>
        </div>
      </div>
    </div>
  );
}