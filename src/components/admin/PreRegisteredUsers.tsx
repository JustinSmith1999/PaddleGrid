import { useState, useEffect } from 'react';
import { Upload, UserPlus, CheckCircle, XCircle, Trash2, Download, Search, TrendingUp, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface PreRegisteredUser {
  id: string;
  first_name?: string;
  last_name?: string;
  email: string;
  phone?: string;
  member_number?: string;
  family_id?: string;
  family_name?: string;
  membership_name?: string;
  membership_type?: string;
  membership_status?: string;
  assignment_type?: string;
  start_date?: string;
  next_payment_date?: string;
  frequency?: string;
  amount?: number;
  amount_with_tax?: number;
  end_date?: string;
  billing_cycles?: number;
  cancelled_date?: string;
  suspended_on?: string;
  cancellation_reason?: string;
  suspended_reason?: string;
  notes?: string;
  claimed: boolean;
  claimed_at?: string;
  import_batch_id?: string;
  imported_at: string;
  created_at: string;
}

export default function PreRegisteredUsers() {
  const { profile } = useAuth();
  const [users, setUsers] = useState<PreRegisteredUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'claimed' | 'unclaimed'>('all');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const facilityId = profile?.facility_id;

  useEffect(() => {
    if (facilityId) {
      loadUsers();
    }
  }, [facilityId, filterStatus]);

  async function loadUsers() {
    if (!facilityId) return;

    setLoading(true);
    try {
      let query = supabase
        .from('pre_memberships')
        .select('*')
        .eq('facility_id', facilityId)
        .order('"Created At"', { ascending: false });

      if (filterStatus === 'claimed') {
        query = query.eq('claimed', true);
      } else if (filterStatus === 'unclaimed') {
        query = query.eq('claimed', false);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Map the data to match the expected interface
      const mappedData = (data || []).map((row: any) => ({
        id: row['Member #']?.toString() || Math.random().toString(),
        first_name: row.first_name || '',
        last_name: row.last_name || '',
        email: row['Email'] || '',
        phone: row.phone || '',
        member_number: row['Member #']?.toString() || '',
        family_id: row['Family ID'] || '',
        family_name: row['Family'] || '',
        membership_name: row['Membership Name'] || '',
        membership_type: row['Assignment Type'] || '',
        membership_status: row['Status'] || 'active',
        assignment_type: row['Assignment Type'] || '',
        start_date: row['Start Date'] || '',
        next_payment_date: row['Next Payment Date'] || '',
        frequency: row['Frequency'] || '',
        amount: row['Amount'] || 0,
        amount_with_tax: row['Amount with Tax'] || 0,
        end_date: row['End Date'] || '',
        billing_cycles: row['# of Billing Cycles'] || 0,
        cancelled_date: row['Cancelled Date'] || '',
        suspended_on: row['Suspended On'] || '',
        cancellation_reason: row['Cancellation Reason'] || '',
        suspended_reason: row['Suspended Reason'] || '',
        notes: '',
        claimed: row.claimed || false,
        claimed_at: row.claimed_at || '',
        import_batch_id: row.import_batch_id || '',
        imported_at: row['Created At'] || '',
        created_at: row['Created At'] || '',
      }));

      setUsers(mappedData);
    } catch (err) {
      console.error('Error loading pre-registered users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  }

  function parseMemberName(memberName: string): { firstName: string; lastName: string } {
    if (!memberName) return { firstName: '', lastName: '' };

    const parts = memberName.trim().split(/\s+/);
    if (parts.length === 1) {
      return { firstName: parts[0], lastName: '' };
    } else if (parts.length === 2) {
      return { firstName: parts[0], lastName: parts[1] };
    } else {
      return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
    }
  }

  function parseDate(dateStr: string): string | null {
    if (!dateStr || dateStr.trim() === '') return null;

    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return null;
      return date.toISOString().split('T')[0];
    } catch {
      return null;
    }
  }

  function parseAmount(amountStr: string): number | null {
    if (!amountStr || amountStr.trim() === '') return null;

    const cleaned = amountStr.replace(/[$,]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  }

  async function handleCSVUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !facilityId) return;

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());

      if (lines.length < 2) {
        throw new Error('CSV file appears to be empty');
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

      const memberNumberIdx = headers.findIndex(h => h.includes('member') && h.includes('#'));
      const memberNameIdx = headers.findIndex(h => h === 'member name');
      const familyIdIdx = headers.findIndex(h => h === 'family id');
      const emailIdx = headers.findIndex(h => h === 'email');
      const familyIdx = headers.findIndex(h => h === 'family');
      const membershipNameIdx = headers.findIndex(h => h === 'membership name');
      const assignmentTypeIdx = headers.findIndex(h => h === 'assignment type');
      const startDateIdx = headers.findIndex(h => h === 'start date');
      const nextPaymentIdx = headers.findIndex(h => h === 'next payment date');
      const frequencyIdx = headers.findIndex(h => h === 'frequency');
      const amountIdx = headers.findIndex(h => h === 'amount');
      const amountWithTaxIdx = headers.findIndex(h => h === 'amount with tax');
      const endDateIdx = headers.findIndex(h => h === 'end date');
      const billingCyclesIdx = headers.findIndex(h => h.includes('billing cycles'));
      const statusIdx = headers.findIndex(h => h === 'status');
      const cancelledDateIdx = headers.findIndex(h => h === 'cancelled date');
      const suspendedOnIdx = headers.findIndex(h => h === 'suspended on');
      const cancellationReasonIdx = headers.findIndex(h => h === 'cancellation reason');
      const suspendedReasonIdx = headers.findIndex(h => h === 'suspended reason');

      const firstNameIdx = headers.findIndex(h => h.includes('first') && h.includes('name'));
      const lastNameIdx = headers.findIndex(h => h.includes('last') && h.includes('name'));
      const phoneIdx = headers.findIndex(h => h.includes('phone'));

      const isCourtReserveFormat = memberNumberIdx !== -1 || memberNameIdx !== -1;

      if (!isCourtReserveFormat && (firstNameIdx === -1 || lastNameIdx === -1 || emailIdx === -1)) {
        throw new Error('CSV must have columns for email and either "Member Name" or both first/last name');
      }

      if (emailIdx === -1) {
        throw new Error('CSV must have an Email column');
      }

      const batchId = `import-${Date.now()}`;
      const usersToInsert = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));

        if (values.length < 3) continue;

        const email = values[emailIdx];
        if (!email) continue;

        let firstName = '';
        let lastName = '';

        if (isCourtReserveFormat && memberNameIdx !== -1) {
          const parsed = parseMemberName(values[memberNameIdx]);
          firstName = parsed.firstName;
          lastName = parsed.lastName;
        } else {
          firstName = firstNameIdx !== -1 ? values[firstNameIdx] : '';
          lastName = lastNameIdx !== -1 ? values[lastNameIdx] : '';
        }

        const userRecord: any = {
          first_name: firstName,
          last_name: lastName,
          email: email.toLowerCase(),
          facility_id: facilityId,
          import_batch_id: batchId,
          imported_by: profile?.id,
        };

        if (memberNumberIdx !== -1) userRecord.member_number = values[memberNumberIdx];
        if (familyIdIdx !== -1) userRecord.family_id = values[familyIdIdx];
        if (familyIdx !== -1) userRecord.family_name = values[familyIdx];
        if (membershipNameIdx !== -1) userRecord.membership_name = values[membershipNameIdx];
        if (assignmentTypeIdx !== -1) userRecord.assignment_type = values[assignmentTypeIdx];
        if (startDateIdx !== -1) userRecord.start_date = parseDate(values[startDateIdx]);
        if (nextPaymentIdx !== -1) userRecord.next_payment_date = parseDate(values[nextPaymentIdx]);
        if (frequencyIdx !== -1) userRecord.frequency = values[frequencyIdx];
        if (amountIdx !== -1) userRecord.amount = parseAmount(values[amountIdx]);
        if (amountWithTaxIdx !== -1) userRecord.amount_with_tax = parseAmount(values[amountWithTaxIdx]);
        if (endDateIdx !== -1) userRecord.end_date = parseDate(values[endDateIdx]);
        if (billingCyclesIdx !== -1) {
          const cycles = parseInt(values[billingCyclesIdx]);
          userRecord.billing_cycles = isNaN(cycles) ? null : cycles;
        }
        if (statusIdx !== -1) userRecord.membership_status = values[statusIdx];
        if (cancelledDateIdx !== -1) userRecord.cancelled_date = parseDate(values[cancelledDateIdx]);
        if (suspendedOnIdx !== -1) userRecord.suspended_on = parseDate(values[suspendedOnIdx]);
        if (cancellationReasonIdx !== -1) userRecord.cancellation_reason = values[cancellationReasonIdx];
        if (suspendedReasonIdx !== -1) userRecord.suspended_reason = values[suspendedReasonIdx];
        if (phoneIdx !== -1) userRecord.phone = values[phoneIdx];

        usersToInsert.push(userRecord);
      }

      if (usersToInsert.length === 0) {
        throw new Error('No valid user records found in CSV');
      }

      const { error: insertError } = await supabase
        .from('pre_memberships')
        .insert(usersToInsert.map(user => ({
          'Email': user.email,
          'Member Name': `${user.first_name} ${user.last_name}`.trim(),
          first_name: user.first_name,
          last_name: user.last_name,
          phone: user.phone,
          'Member #': user.member_number,
          'Family ID': user.family_id,
          'Family': user.family_name,
          'Membership Name': user.membership_name,
          'Assignment Type': user.assignment_type,
          'Start Date': user.start_date,
          'Next Payment Date': user.next_payment_date,
          'Frequency': user.frequency,
          'Amount': user.amount,
          'Amount with Tax': user.amount_with_tax,
          'End Date': user.end_date,
          '# of Billing Cycles': user.billing_cycles,
          'Status': user.membership_status,
          'Cancelled Date': user.cancelled_date,
          'Suspended On': user.suspended_on,
          'Cancellation Reason': user.cancellation_reason,
          'Suspended Reason': user.suspended_reason,
          facility_id: user.facility_id,
          import_batch_id: user.import_batch_id,
          imported_by: user.imported_by,
          claimed: false
        })));

      if (insertError) throw insertError;

      setSuccess(`Successfully imported ${usersToInsert.length} users`);
      loadUsers();
      e.target.value = '';
    } catch (err) {
      console.error('Error uploading CSV:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload CSV');
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteUser(memberEmail: string) {
    if (!confirm('Are you sure you want to delete this pre-registered user?')) return;

    try {
      const { error } = await supabase
        .from('pre_memberships')
        .delete()
        .eq('Email', memberEmail);

      if (error) throw error;

      setSuccess('User deleted successfully');
      loadUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Failed to delete user');
    }
  }

  function exportToCSV() {
    const csvHeaders = [
      'Member #', 'Member Name', 'First Name', 'Last Name', 'Email', 'Phone',
      'Family ID', 'Family', 'Membership Name', 'Status', 'Start Date',
      'Next Payment', 'Amount', 'Frequency', 'Claimed', 'Claimed At'
    ];
    const csvRows = filteredUsers.map(user => [
      user.member_number || '',
      `${user.first_name || ''} ${user.last_name || ''}`.trim(),
      user.first_name || '',
      user.last_name || '',
      user.email,
      user.phone || '',
      user.family_id || '',
      user.family_name || '',
      user.membership_name || '',
      user.membership_status || '',
      user.start_date || '',
      user.next_payment_date || '',
      user.amount ? `$${user.amount.toFixed(2)}` : '',
      user.frequency || '',
      user.claimed ? 'Yes' : 'No',
      user.claimed_at ? new Date(user.claimed_at).toLocaleDateString() : ''
    ]);

    const csv = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pre-registered-users-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  }

  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (user.first_name && user.first_name.toLowerCase().includes(searchLower)) ||
      (user.last_name && user.last_name.toLowerCase().includes(searchLower)) ||
      user.email.toLowerCase().includes(searchLower) ||
      (user.phone && user.phone.includes(searchTerm)) ||
      (user.member_number && user.member_number.toLowerCase().includes(searchLower)) ||
      (user.family_name && user.family_name.toLowerCase().includes(searchLower))
    );
  });

  const stats = {
    total: users.length,
    claimed: users.filter(u => u.claimed).length,
    unclaimed: users.filter(u => !u.claimed).length,
    adoptionRate: users.length > 0 ? Math.round((users.filter(u => u.claimed).length / users.length) * 100) : 0,
    activeMembers: users.filter(u => u.membership_status?.toLowerCase() === 'active').length,
    suspendedMembers: users.filter(u => u.membership_status?.toLowerCase() === 'suspended').length,
    cancelledMembers: users.filter(u => u.membership_status?.toLowerCase() === 'cancelled').length,
  };

  if (!facilityId) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">You must be associated with a facility to manage pre-registered users.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">CourtReserve Members</h2>
          <p className="text-gray-600 mt-1">Track adoption of your existing member base</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={exportToCSV}
            disabled={filteredUsers.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>

          <label className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 cursor-pointer">
            <Upload className="w-4 h-4" />
            {uploading ? 'Uploading...' : 'Import CSV'}
            <input
              type="file"
              accept=".csv"
              onChange={handleCSVUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {(error || success) && (
        <div className={`p-4 rounded-lg ${error ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {error || success}
        </div>
      )}

      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-8 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-8 h-8" />
              <h3 className="text-2xl font-bold">Adoption Score</h3>
            </div>
            <p className="text-emerald-50 text-sm">
              {stats.claimed.toLocaleString()} of {stats.total.toLocaleString()} CourtReserve members have created PaddleGrid accounts
            </p>
          </div>
          <div className="text-right">
            <div className="text-6xl font-bold">{stats.adoptionRate}%</div>
            <div className="text-emerald-50 text-sm mt-1">Platform Adoption</div>
          </div>
        </div>
        <div className="mt-6">
          <div className="w-full bg-emerald-400/30 rounded-full h-4">
            <div
              className="bg-white rounded-full h-4 transition-all duration-500"
              style={{ width: `${stats.adoptionRate}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-gray-400" />
            <div className="text-sm text-gray-600">Total Members</div>
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.total.toLocaleString()}</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <div className="text-sm text-gray-600">Active</div>
          </div>
          <div className="text-3xl font-bold text-green-600">{stats.activeMembers.toLocaleString()}</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            <div className="text-sm text-gray-600">Claimed</div>
          </div>
          <div className="text-3xl font-bold text-emerald-600">{stats.claimed.toLocaleString()}</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-5 h-5 text-gray-400" />
            <div className="text-sm text-gray-600">Unclaimed</div>
          </div>
          <div className="text-3xl font-bold text-gray-600">{stats.unclaimed.toLocaleString()}</div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200 space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, email, member #, family..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  filterStatus === 'all'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterStatus('claimed')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  filterStatus === 'claimed'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Claimed
              </button>
              <button
                onClick={() => setFilterStatus('unclaimed')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  filterStatus === 'unclaimed'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Unclaimed
              </button>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
            <strong>Supported Formats:</strong>
            <ul className="mt-1 ml-4 list-disc">
              <li><strong>CourtReserve Export:</strong> Automatically detects and imports all membership data from CourtReserve member exports</li>
              <li><strong>Simple Format:</strong> First Name, Last Name, Email (required), Phone, Membership Type (optional)</li>
            </ul>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Family</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Membership</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Claimed</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    No pre-registered users found. Upload a CSV to get started.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{user.member_number || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {user.first_name} {user.last_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{user.family_name || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{user.membership_name || user.membership_type || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.membership_status?.toLowerCase() === 'active'
                          ? 'bg-green-100 text-green-800'
                          : user.membership_status?.toLowerCase() === 'suspended'
                          ? 'bg-yellow-100 text-yellow-800'
                          : user.membership_status?.toLowerCase() === 'cancelled'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.membership_status || 'active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.claimed ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm">
                            {user.claimed_at ? new Date(user.claimed_at).toLocaleDateString() : 'Yes'}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-gray-400">
                          <XCircle className="w-4 h-4" />
                          <span className="text-sm">Pending</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDeleteUser(user.email)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
