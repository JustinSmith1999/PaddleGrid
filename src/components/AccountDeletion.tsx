import { useState } from 'react';
import { ArrowLeft, AlertTriangle, Trash2, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function AccountDeletion() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState<'info' | 'confirm' | 'pending' | 'error'>('info');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletionRequested, setDeletionRequested] = useState(false);

  const handleRequestDeletion = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const { error: rpcError } = await supabase.rpc('request_account_deletion');
      if (rpcError) throw rpcError;
      setDeletionRequested(true);
      setStep('pending');
    } catch (err: any) {
      setError(err.message || 'Failed to request account deletion. Please try again.');
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelDeletion = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const { error: rpcError } = await supabase.rpc('cancel_account_deletion');
      if (rpcError) throw rpcError;
      setDeletionRequested(false);
      setStep('info');
    } catch (err: any) {
      setError(err.message || 'Failed to cancel deletion request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-200">
        <div className="max-w-xl mx-auto flex items-center gap-4 px-6 py-3">
          <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-base font-semibold text-[#1B2A4A]">Delete Account</span>
        </div>
      </nav>

      <div className="max-w-xl mx-auto px-6 py-12">
        {step === 'info' && (
          <div className="space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
              <AlertTriangle className="w-7 h-7 text-red-500" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-[#1B2A4A] mb-2">Delete your account</h1>
              <p className="text-base text-gray-500">
                This action will permanently remove your account and all associated data after a 30-day grace period.
              </p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-red-800">What will be deleted:</h3>
              <ul className="text-sm text-red-700 space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 w-1 h-1 rounded-full bg-red-400 flex-shrink-0" />
                  Your profile, photos, and personal information
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 w-1 h-1 rounded-full bg-red-400 flex-shrink-0" />
                  All booking history and court reservations
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 w-1 h-1 rounded-full bg-red-400 flex-shrink-0" />
                  Match results, stats, and achievements
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 w-1 h-1 rounded-full bg-red-400 flex-shrink-0" />
                  Community posts, comments, and messages
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 w-1 h-1 rounded-full bg-red-400 flex-shrink-0" />
                  Play streaks and leaderboard rankings
                </li>
              </ul>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-amber-800 mb-1">30-day grace period</h3>
              <p className="text-sm text-amber-700">
                After requesting deletion, you have 30 days to change your mind. During this period,
                you can sign back in and cancel the deletion. After 30 days, your data is permanently
                removed and cannot be recovered.
              </p>
            </div>

            <div className="pt-4 space-y-3">
              <button
                onClick={() => setStep('confirm')}
                className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm py-3 rounded-xl transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                I want to delete my account
              </button>
              <button
                onClick={() => navigate(-1)}
                className="w-full text-sm font-medium text-gray-500 hover:text-gray-700 py-2 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {step === 'confirm' && (
          <div className="space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
              <Trash2 className="w-7 h-7 text-red-500" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-[#1B2A4A] mb-2">Are you sure?</h1>
              <p className="text-base text-gray-500">
                Type your email address to confirm you want to delete your account.
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
              <p className="text-sm text-gray-500">Signed in as</p>
              <p className="text-sm font-semibold text-[#1B2A4A]">{user.email}</p>
            </div>

            <div className="pt-2 space-y-3">
              <button
                onClick={handleRequestDeletion}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold text-sm py-3 rounded-xl transition-colors"
              >
                {loading ? 'Processing...' : 'Permanently delete my account'}
              </button>
              <button
                onClick={() => setStep('info')}
                className="w-full text-sm font-medium text-gray-500 hover:text-gray-700 py-2 transition-colors"
              >
                Go back
              </button>
            </div>
          </div>
        )}

        {step === 'pending' && (
          <div className="space-y-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7 text-amber-500" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-[#1B2A4A] mb-2">Deletion requested</h1>
              <p className="text-base text-gray-500">
                Your account is scheduled for deletion. You have 30 days to change your mind.
                Sign back in and visit this page to cancel.
              </p>
            </div>

            <div className="pt-2 space-y-3">
              <button
                onClick={handleCancelDeletion}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-[#6DB33F] hover:bg-[#5E9A35] disabled:opacity-50 text-white font-semibold text-sm py-3 rounded-xl transition-colors"
              >
                <XCircle className="w-4 h-4" />
                {loading ? 'Processing...' : 'Cancel deletion — keep my account'}
              </button>
              <button
                onClick={() => navigate('/')}
                className="w-full text-sm font-medium text-gray-500 hover:text-gray-700 py-2 transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        )}

        {step === 'error' && (
          <div className="space-y-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto">
              <XCircle className="w-7 h-7 text-red-500" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-[#1B2A4A] mb-2">Something went wrong</h1>
              <p className="text-base text-gray-500">{error}</p>
            </div>
            <button
              onClick={() => setStep('info')}
              className="w-full bg-gray-100 hover:bg-gray-200 text-[#1B2A4A] font-semibold text-sm py-3 rounded-xl transition-colors"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
