import { useState, useEffect } from 'react';
import { FileText, Download, Search, Calendar, User, Mail, Phone, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface SignedWaiver {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  signature: string;
  signed_at: string;
  is_minor: boolean;
  parent_guardian_name: string | null;
  parent_guardian_signature: string | null;
  ip_address: string | null;
  waiver_title?: string;
}

export default function SignedWaiversPanel() {
  const { user } = useAuth();
  const [waivers, setWaivers] = useState<SignedWaiver[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWaiver, setSelectedWaiver] = useState<SignedWaiver | null>(null);

  useEffect(() => {
    loadSignedWaivers();
  }, [user]);

  async function loadSignedWaivers() {
    if (!user) return;

    try {
      // Get facilities the user manages
      const { data: facilityUsers } = await supabase
        .from('facility_users')
        .select('facility_id')
        .eq('user_id', user.id)
        .in('role', ['owner', 'admin']);

      if (!facilityUsers || facilityUsers.length === 0) {
        setLoading(false);
        return;
      }

      const facilityIds = facilityUsers.map(fu => fu.facility_id);

      // Get signed waivers for those facilities
      const { data, error } = await supabase
        .from('signed_waivers')
        .select(`
          *,
          facility_waivers (
            title
          )
        `)
        .in('facility_id', facilityIds)
        .order('signed_at', { ascending: false });

      if (error) throw error;

      const waiversWithTitle = data?.map((w: any) => ({
        ...w,
        waiver_title: w.facility_waivers?.title || 'Liability Waiver'
      })) || [];

      setWaivers(waiversWithTitle);
    } catch (err) {
      console.error('Error loading signed waivers:', err);
    } finally {
      setLoading(false);
    }
  }

  const filteredWaivers = waivers.filter(waiver =>
    waiver.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    waiver.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function downloadWaiver(waiver: SignedWaiver) {
    const content = `
SIGNED WAIVER RECORD
${waiver.waiver_title}

Signed At: ${formatDate(waiver.signed_at)}
IP Address: ${waiver.ip_address || 'N/A'}

PLAYER INFORMATION
Name: ${waiver.full_name}
Email: ${waiver.email}
Phone: ${waiver.phone || 'N/A'}
Signature: ${waiver.signature}

${waiver.is_minor ? `
PARENT/GUARDIAN INFORMATION
Name: ${waiver.parent_guardian_name || 'N/A'}
Signature: ${waiver.parent_guardian_signature || 'N/A'}
` : ''}

This is a legally binding electronic signature.
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `waiver-${waiver.full_name.replace(/\s+/g, '-')}-${new Date(waiver.signed_at).toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Signed Waivers
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            View all liability waivers signed by players
          </p>
        </div>
        <div className="text-sm text-slate-600 dark:text-slate-400">
          Total: {waivers.length}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:bg-slate-800 dark:text-white"
        />
      </div>

      {/* Waivers List */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden">
        {filteredWaivers.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-600 dark:text-slate-400">
              {searchTerm ? 'No waivers found matching your search' : 'No signed waivers yet'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Player
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Signed Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredWaivers.map((waiver) => (
                  <tr
                    key={waiver.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer"
                    onClick={() => setSelectedWaiver(waiver)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                          <User className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="ml-3">
                          <div className="font-medium text-slate-900 dark:text-white">
                            {waiver.full_name}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {waiver.signature}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                          <Mail className="w-4 h-4" />
                          {waiver.email}
                        </div>
                        {waiver.phone && (
                          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                            <Phone className="w-4 h-4" />
                            {waiver.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <Calendar className="w-4 h-4" />
                        {formatDate(waiver.signed_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {waiver.is_minor ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                          Minor
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                          Adult
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadWaiver(waiver);
                        }}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors text-sm"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedWaiver && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Waiver Details
              </h3>
              <button
                onClick={() => setSelectedWaiver(null)}
                className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 mb-2">
                  <FileText className="w-5 h-5" />
                  <span className="font-semibold">{selectedWaiver.waiver_title}</span>
                </div>
                <p className="text-sm text-emerald-600 dark:text-emerald-400">
                  Signed on {formatDate(selectedWaiver.signed_at)}
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white mb-3">
                  Player Information
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Full Name:</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {selectedWaiver.full_name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Email:</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {selectedWaiver.email}
                    </span>
                  </div>
                  {selectedWaiver.phone && (
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Phone:</span>
                      <span className="font-medium text-slate-900 dark:text-white">
                        {selectedWaiver.phone}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Signature:</span>
                    <span className="font-['Brush_Script_MT',cursive] text-xl text-slate-900 dark:text-white">
                      {selectedWaiver.signature}
                    </span>
                  </div>
                </div>
              </div>

              {selectedWaiver.is_minor && (
                <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-3">
                    Parent/Guardian Information
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Name:</span>
                      <span className="font-medium text-slate-900 dark:text-white">
                        {selectedWaiver.parent_guardian_name || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Signature:</span>
                      <span className="font-['Brush_Script_MT',cursive] text-xl text-slate-900 dark:text-white">
                        {selectedWaiver.parent_guardian_signature || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                <h4 className="font-semibold text-slate-900 dark:text-white mb-3">
                  Verification Details
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">IP Address:</span>
                    <span className="text-slate-900 dark:text-white">
                      {selectedWaiver.ip_address || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Timestamp:</span>
                    <span className="text-slate-900 dark:text-white">
                      {formatDate(selectedWaiver.signed_at)}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => downloadWaiver(selectedWaiver)}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <Download className="w-5 h-5" />
                Download Waiver Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
