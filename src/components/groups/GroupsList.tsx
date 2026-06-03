import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, Lock, Globe, UserPlus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import CreateGroupModal from './CreateGroupModal';

interface Group {
  id: string;
  name: string;
  description: string | null;
  cover_image_url: string | null;
  visibility: 'public' | 'private' | 'invite_only';
  member_count: number;
  owner_id: string | null;
  is_member?: boolean;
  my_role?: 'owner' | 'admin' | 'member' | null;
}

interface Props {
  facilityId?: string;
  onOpenGroup?: (groupId: string) => void;
}

/**
 * "My Groups" — the top-level groups surface.
 * Shows the user's groups in a "Yours" section, plus a discover row below.
 */
export default function GroupsList({ facilityId, onOpenGroup }: Props) {
  const { user } = useAuth();
  const [yours, setYours] = useState<Group[]>([]);
  const [discover, setDiscover] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    // All active groups for the facility
    let q = supabase.from('groups').select('*').eq('is_active', true).order('member_count', { ascending: false }).limit(40);
    if (facilityId) q = q.eq('facility_id', facilityId);
    const { data: allRows } = await q;
    const all = (allRows || []) as Group[];

    let myIds = new Set<string>();
    let myRoles = new Map<string, 'owner' | 'admin' | 'member'>();
    if (user) {
      const { data: memRows } = await supabase
        .from('group_members')
        .select('group_id, role')
        .eq('user_id', user.id);
      (memRows || []).forEach((r: any) => {
        myIds.add(r.group_id);
        myRoles.set(r.group_id, r.role);
      });
    }
    all.forEach((g) => {
      g.is_member = myIds.has(g.id);
      g.my_role = myRoles.get(g.id) || null;
    });
    setYours(all.filter((g) => g.is_member));
    setDiscover(all.filter((g) => !g.is_member && g.visibility !== 'invite_only'));
    setLoading(false);
  };

  useEffect(() => { void load(); }, [user?.id, facilityId]);

  const join = async (g: Group) => {
    if (!user) return;
    // Optimistic
    setDiscover((d) => d.filter((x) => x.id !== g.id));
    setYours((y) => [{ ...g, is_member: true, my_role: 'member', member_count: g.member_count + 1 }, ...y]);
    const { error } = await supabase.from('group_members').insert({ group_id: g.id, user_id: user.id, role: 'member' });
    if (error) {
      void load();
    }
  };

  return (
    <div className="px-4 sm:px-6 py-5 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "'Cinzel','Manrope',serif" }}>My Groups</h1>
          <p className="text-xs text-slate-500 mt-1">Keep similar people together. Post to the group, plan tournaments, share inside jokes.</p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New group</span>
          <span className="sm:hidden">New</span>
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0,1,2].map(i => <div key={i} className="h-24 rounded-2xl bg-slate-100 animate-pulse" />)}
        </div>
      ) : (
        <>
          <section className="space-y-3">
            <h2 className="text-[11px] uppercase tracking-wider font-bold text-slate-500">Yours</h2>
            {yours.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-5 py-8 text-center">
                <div className="inline-flex w-10 h-10 rounded-2xl bg-emerald-100 items-center justify-center text-emerald-700 mb-3"><UserPlus className="w-5 h-5" /></div>
                <p className="text-sm text-slate-700 font-semibold mb-1">You're not in any groups yet</p>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">Join one below — or start your own (Thursday Night Crew, anyone?).</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {yours.map((g) => <GroupCard key={g.id} group={g} onOpen={() => onOpenGroup?.(g.id)} />)}
              </div>
            )}
          </section>

          <section className="space-y-3">
            <h2 className="text-[11px] uppercase tracking-wider font-bold text-slate-500">Discover</h2>
            {discover.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No new groups to join right now.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {discover.map((g) => <GroupCard key={g.id} group={g} onJoin={() => join(g)} onOpen={() => onOpenGroup?.(g.id)} />)}
              </div>
            )}
          </section>
        </>
      )}

      {createOpen && (
        <CreateGroupModal
          facilityId={facilityId}
          onClose={() => setCreateOpen(false)}
          onCreated={() => { setCreateOpen(false); void load(); }}
        />
      )}
    </div>
  );
}

function GroupCard({ group, onOpen, onJoin }: { group: Group; onOpen?: () => void; onJoin?: () => void }) {
  const VisIcon = group.visibility === 'public' ? Globe : Lock;
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -1 }}
      onClick={onOpen}
      className="group cursor-pointer rounded-2xl border border-slate-200/60 bg-white overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition"
    >
      <div className="h-20 bg-slate-100 relative overflow-hidden">
        {group.cover_image_url && (
          <img src={group.cover_image_url} alt="" className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
      </div>
      <div className="px-4 py-3.5">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="text-sm font-bold text-slate-900 leading-tight truncate" style={{ fontFamily: "'Cinzel','Manrope',serif" }}>{group.name}</h3>
          {group.my_role === 'owner' && <span className="px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[9px] font-bold uppercase tracking-wide flex-shrink-0">Owner</span>}
          {group.my_role === 'admin' && <span className="px-1.5 py-0.5 rounded-md bg-sky-50 text-sky-700 text-[9px] font-bold uppercase tracking-wide flex-shrink-0">Admin</span>}
        </div>
        {group.description && <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-2.5">{group.description}</p>}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-[11px] text-slate-500">
            <span className="inline-flex items-center gap-1 font-semibold"><Users className="w-3 h-3" /> {group.member_count}</span>
            <span className="inline-flex items-center gap-1"><VisIcon className="w-3 h-3" /> {group.visibility.replace('_', ' ')}</span>
          </div>
          {onJoin && !group.is_member && (
            <button
              onClick={(e) => { e.stopPropagation(); onJoin(); }}
              className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold transition"
            >
              Join
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
