import { Home, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="inline-block p-4 bg-emerald-100 rounded-full mb-4">
            <svg
              className="w-16 h-16 text-emerald-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-6xl font-bold text-gray-800 mb-2">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-3">Page Not Found</h2>
          <p className="text-gray-600">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => navigate('/')}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
          >
            <Home className="w-5 h-5" />
            Go to Home
          </button>

          <button
            onClick={() => navigate(-1)}
            className="w-full bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 border-2 border-gray-200 hover:border-gray-300"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </button>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Need help? <a href="mailto:support@paddlegrid.com" className="text-emerald-600 hover:text-emerald-700 font-medium">Contact Support</a>
          </p>
        </div>
      </div>
    </div>
  );
}
