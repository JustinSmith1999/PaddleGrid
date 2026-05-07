import { useEffect, useState } from 'react';
import { Users as UsersIcon, Mail, Phone, Shield, Loader2 } from 'lucide-react';
import { supabase, fetchAllRows } from '../../lib/supabase';

interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: 'user' | 'admin';
  created_at: string;
}

export function AdminUsers() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const data = await fetchAllRows<Profile>(() =>
        supabase.from('profiles').select('*').order('created_at', { ascending: false })
      );
      setProfiles(data);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: 'user' | 'admin') => {
    if (
      !confirm(
        `Are you sure you want to change this user's role to ${newRole.toUpperCase()}?`
      )
    ) {
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;
      await fetchProfiles();
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Failed to update user role');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">All Users</h2>
        <div className="flex items-center gap-2 text-gray-600">
          <UsersIcon className="w-5 h-5" />
          <span className="font-semibold">{profiles.length} Total Users</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {profiles.map((profile) => (
          <div
            key={profile.id}
            className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-800 mb-1">{profile.full_name}</h3>
                <div className="space-y-2">
                  <div className="flex items-center text-gray-600 text-sm">
                    <Mail className="w-4 h-4 mr-2 text-emerald-600" />
                    {profile.email}
                  </div>
                  {profile.phone && (
                    <div className="flex items-center text-gray-600 text-sm">
                      <Phone className="w-4 h-4 mr-2 text-emerald-600" />
                      {profile.phone}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Shield
                  className={`w-5 h-5 ${
                    profile.role === 'admin' ? 'text-purple-600' : 'text-gray-400'
                  }`}
                />
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    profile.role === 'admin'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {profile.role.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <span className="text-sm text-gray-500">
                Joined {new Date(profile.created_at).toLocaleDateString()}
              </span>

              <select
                value={profile.role}
                onChange={(e) =>
                  updateUserRole(profile.id, e.target.value as 'user' | 'admin')
                }
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
        ))}
      </div>

      {profiles.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-2xl">
          <UsersIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No users found</p>
        </div>
      )}
    </div>
  );
}
