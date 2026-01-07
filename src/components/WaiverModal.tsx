import { useState, useEffect } from 'react';
import { X, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface WaiverModalProps {
  facilityId: string;
  facilityName: string;
  onClose: () => void;
  onSigned: () => void;
}

interface FacilityWaiver {
  id: string;
  title: string;
  content: string;
  address: string | null;
  requires_parent_guardian: boolean;
}

export default function WaiverModal({ facilityId, facilityName, onClose, onSigned }: WaiverModalProps) {
  const { user } = useAuth();
  const [waiver, setWaiver] = useState<FacilityWaiver | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [signature, setSignature] = useState('');
  const [agreed, setAgreed] = useState(false);

  const [isMinor, setIsMinor] = useState(false);
  const [parentName, setParentName] = useState('');
  const [parentSignature, setParentSignature] = useState('');

  useEffect(() => {
    loadWaiver();
    loadUserInfo();
  }, [facilityId]);

  async function loadWaiver() {
    try {
      const { data, error } = await supabase
        .from('facility_waivers')
        .select('*')
        .eq('facility_id', facilityId)
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        setError('No active waiver found for this facility');
        return;
      }

      setWaiver(data);
    } catch (err: any) {
      console.error('Error loading waiver:', err);
      setError('Failed to load waiver');
    } finally {
      setLoading(false);
    }
  }

  async function loadUserInfo() {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .single();

      if (data) {
        setFullName(data.full_name || '');
        setEmail(data.email || user.email || '');
      }
    } catch (err) {
      console.error('Error loading user info:', err);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !waiver) return;

    if (!agreed) {
      setError('You must read and agree to the waiver terms');
      return;
    }

    if (!signature.trim()) {
      setError('Please type your full name as your signature');
      return;
    }

    if (isMinor && (!parentName.trim() || !parentSignature.trim())) {
      setError('Parent/Guardian information is required for minors');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const { error: insertError } = await supabase
        .from('signed_waivers')
        .insert({
          user_id: user.id,
          facility_id: facilityId,
          waiver_id: waiver.id,
          full_name: fullName,
          email: email,
          phone: phone,
          signature: signature,
          is_minor: isMinor,
          parent_guardian_name: isMinor ? parentName : null,
          parent_guardian_signature: isMinor ? parentSignature : null
        });

      if (insertError) throw insertError;

      onSigned();
    } catch (err: any) {
      console.error('Error signing waiver:', err);
      setError(err.message || 'Failed to sign waiver');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!waiver) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-8">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              No Waiver Available
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              This facility does not have an active waiver.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full my-4 mx-4 max-h-[95vh] flex flex-col">
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-4 flex items-center justify-between rounded-t-2xl z-10 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white truncate">
                Liability Waiver Required
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 truncate">
                {facilityName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors flex-shrink-0 ml-2"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
          <div className="p-4 sm:p-6 space-y-6">
            {/* Waiver Content */}
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 sm:p-6 max-h-[40vh] overflow-y-auto border border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white mb-4 break-words">
                {waiver.title}
              </h3>
              {waiver.address && (
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-4 break-words">
                  {waiver.address}
                </p>
              )}
              <div className="space-y-3">
                {waiver.content.split('\n').map((paragraph, idx) => (
                  <p key={idx} className="text-sm text-slate-700 dark:text-slate-300 break-words whitespace-pre-wrap leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 dark:text-red-300 break-words">{error}</p>
              </div>
            )}

            {/* Player Information */}
            <div className="space-y-4">
              <h4 className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base">
                Player Information
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="isMinor"
                  checked={isMinor}
                  onChange={(e) => setIsMinor(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 mt-0.5 flex-shrink-0"
                />
                <label htmlFor="isMinor" className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 break-words">
                  I am under 18 years old (requires parent/guardian signature)
                </label>
              </div>
            </div>

            {/* Parent/Guardian Section */}
            {isMinor && (
              <div className="space-y-4 border-t border-slate-200 dark:border-slate-700 pt-6">
                <h4 className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base">
                  Parent/Guardian Information
                </h4>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Parent/Guardian Full Name *
                  </label>
                  <input
                    type="text"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    required={isMinor}
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Parent/Guardian Signature (Type Full Name) *
                  </label>
                  <input
                    type="text"
                    value={parentSignature}
                    onChange={(e) => setParentSignature(e.target.value)}
                    placeholder="Type your full name"
                    required={isMinor}
                    className="w-full px-3 sm:px-4 py-2 text-base sm:text-xl border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-slate-800 dark:text-white font-['Brush_Script_MT',cursive]"
                  />
                </div>
              </div>
            )}

            {/* Signature */}
            <div className="space-y-4 border-t border-slate-200 dark:border-slate-700 pt-6">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Player Signature (Type Full Name) *
                </label>
                <input
                  type="text"
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  placeholder="Type your full name"
                  required
                  className="w-full px-3 sm:px-4 py-2 text-base sm:text-xl border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-slate-800 dark:text-white font-['Brush_Script_MT',cursive]"
                />
              </div>

              <div className="flex items-start gap-3 p-3 sm:p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <input
                  type="checkbox"
                  id="agreed"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  required
                  className="w-4 h-4 sm:w-5 sm:h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 mt-0.5 flex-shrink-0"
                />
                <label htmlFor="agreed" className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 flex-1 break-words leading-relaxed">
                  I have read and understand all provisions in this Waiver, Release of Liability and Indemnification Agreement and agree to abide by them. I understand that by typing my name above, I am electronically signing this document.
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-6 pb-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:flex-1 px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !agreed}
                className="w-full sm:flex-1 px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                    <span>Signing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>Sign Waiver</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
