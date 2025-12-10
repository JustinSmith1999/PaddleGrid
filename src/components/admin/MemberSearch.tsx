import { useState, useEffect } from 'react';
import { Search, Users, Mail, Phone, Calendar, UserPlus, Eye } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Member {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  created_at: string;
}

export default function MemberSearch() {
  const [members, setMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMembers();
  }, []);

  useEffect(() => {
    if (searchTerm.length >= 2) {
      const fuzzyMatch = members.filter(m =>
        m.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.phone?.includes(searchTerm)
      );
      setFilteredMembers(fuzzyMatch);
    } else {
      setFilteredMembers(members);
    }
  }, [searchTerm, members]);

  const loadMembers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) {
      setMembers(data);
      setFilteredMembers(data);
    }
    setLoading(false);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'admin':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'desk':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'coach':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-stone-100 text-stone-800 border-stone-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-stone-800">Members</h2>
          <p className="text-stone-600 mt-1">Search and manage club members</p>
        </div>
        <button className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center space-x-2 font-semibold shadow-sm hover:shadow-md transition-all">
          <UserPlus className="w-5 h-5" />
          <span>Add Member</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-stone-300 rounded-xl bg-white text-stone-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
          />
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="text-stone-600">
            Found {filteredMembers.length} member{filteredMembers.length !== 1 ? 's' : ''}
          </div>
          <div className="flex items-center space-x-2 text-sm text-stone-500">
            <Users className="w-4 h-4" />
            <span>Total: {members.length}</span>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredMembers.map(member => (
              <div
                key={member.id}
                className="bg-stone-50 border border-stone-200 rounded-xl p-6 hover:bg-white hover:shadow-sm transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="text-xl font-bold text-stone-900">{member.full_name}</h3>
                      <span className={`px-3 py-1 text-sm font-semibold rounded-full border capitalize ${getRoleColor(member.role)}`}>
                        {member.role}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center text-stone-700">
                        <Mail className="w-4 h-4 mr-3 text-emerald-600 flex-shrink-0" />
                        <span className="truncate">{member.email}</span>
                      </div>
                      {member.phone && (
                        <div className="flex items-center text-stone-700">
                          <Phone className="w-4 h-4 mr-3 text-emerald-600 flex-shrink-0" />
                          <span>{member.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center text-stone-700">
                        <Calendar className="w-4 h-4 mr-3 text-emerald-600 flex-shrink-0" />
                        <span>Joined {new Date(member.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 ml-6">
                    <button className="px-4 py-2 border border-stone-300 hover:bg-stone-50 rounded-lg font-medium flex items-center space-x-2 transition-colors">
                      <Eye className="w-4 h-4 text-stone-600" />
                      <span className="text-stone-700">View Profile</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {filteredMembers.length === 0 && !loading && (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                <p className="text-stone-500">No members found</p>
                {searchTerm && (
                  <p className="text-stone-400 text-sm mt-1">Try adjusting your search terms</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}