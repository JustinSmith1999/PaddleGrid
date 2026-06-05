import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, ChevronLeft, Crown, ShieldCheck, MessageCircle, Heart, Calendar, Trophy, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import AvatarStack from '../AvatarStack';
import { useAuth } from '../../contexts/AuthContext';

interface Group {
  id: string;
  facility_id: string | null;
  name: string;
  description: string | null;
  cover_image_url: string | null;
  visibility: 'public' | 'private' | 'invite_only';
  member_count: number;
  owner_id: string | null;
}
interface Member {
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
  profiles: { id: string; full_name: string; profile_picture_url: string | null } | null;
}
interface Post {
  id: string; content: string; created_at: string; media_urls: string[] | null;
  profiles: { id: string; full_name: string; profile_picture_url: string | null } | null;
}

interface Props {
  groupId: string;
  onBack?: () => void;
  onPostInGroup?: (groupId: string) => void;
}

/**
 * Single group view — shows cover, header with member count, member rail,
 * a stream of posts tagged to this group, and a CTA to post or run a tournament.
 */
export default function GroupDetail({ groupId, onBack, onPostInGroup }: Props) {
  const { user } = useAuth();
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [myRole, setMyRole] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const [{ data: g }, { data: m }, { data: spg }] = await Promise.all([
      supabase.from('groups').select('*').eq('id', groupId).maybeSingle(),
      supabase
        .from('group_members')
        .select('user_id, role, joined_at, profiles!group_members_user_id_fkey(id, full_name, profile_picture_url)')
        .eq('group_id', groupId)
        .order('joined_at', { ascending: true })
        .limit(50),
      supabase
        .from('social_post_groups')
        .select('post_id, social_posts(id, content, created_at, media_urls, profiles!social_posts_author_id_fkey(id, full_name, profile_picture_url))')
        .eq('group_id', groupId)
        .limit(20),
    ]);
    setGroup(g as Group);
    setMembers((m as unknown as Member[]) || []);
    const ps = ((spg as any[]) || []).map((row) => row.social_posts).filter(Boolean).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setPosts(ps);
    if (user) {
      const mine = (m as unknown as Member[])?.find((x) => x.user_id === user.id);
      setMyRole(mine?.role ?? null);
    }
    setLoading(false);
  };

  useEffect(() => { void load(); }, [groupId, user?.id]);

  const join = async () => {
    if (!user) return;
    await supabase.from('group_members').insert({ group_id: groupId, user_id: user.id, role: 'member' });
    await load();
  };
  const leave = async () => {
    if (!user) return;
    if (!confirm('Leave this group?')) return;
    await supabase.from('group_members').delete().eq('group_id', groupId).eq('user_id', user.id);
    await load();
  };

  if (loading || !group) {
    return (
      <div className="px-4 py-6 max-w-3xl mx-auto space-y-3">
        <div className="h-40 rounded-2xl bg-slate-100 animate-pulse" />
        <div className="h-24 rounded-2xl bg-slate-100 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-8">
      {/* Cover + header */}
      <div className="relative">
        <div className="h-44 sm:h-52 bg-slate-100 overflow-hidden">
          {group.cover_image_url && <img src={group.cover_image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        </div>
        <button
          onClick={onBack}
          className="absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white text-xs font-semibold backdrop-blur-sm transition"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Back
        </button>
        <div className="absolute inset-x-0 bottom-0 px-5 sm:px-6 pb-4 text-white">
          <h1 className="text-2xl sm:text-3xl font-bold leading-tight drop-shadow" style={{ fontFamily: "'Cinzel','Manrope',serif" }}>{group.name}</h1>
          <div className="flex items-center gap-3 mt-1 text-xs">
            <span className="inline-flex items-center gap-1 font-semibold"><Users className="w-3 h-3" /> {group.member_count} members</span>
            <span>·</span>
            <span className="capitalize">{group.visibility.replace('_', ' ')}</span>
          </div>
        </div>
      </div>

      {/* About + CTAs */}
      <div className="px-4 sm:px-6 py-5 space-y-4">
        {group.description && <p className="text-sm text-slate-700 leading-relaxed">{group.description}</p>}

        <div className="flex flex-wrap items-center gap-2">
          {!myRole ? (
            <button
              onClick={join}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-bold shadow-sm transition"
            >
              <Plus className="w-4 h-4" /> Join group
            </button>
          ) : (
            <>
              <button
                onClick={() => onPostInGroup?.(groupId)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-bold shadow-sm transition"
              >
                <MessageCircle className="w-4 h-4" /> Post to {group.name.split(' ')[0]}
              </button>
              <button
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-semibold text-slate-700 transition"
                title="Plan a tournament for this group"
              >
                <Trophy className="w-4 h-4" /> Run a tournament
              </button>
              <button
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-semibold text-slate-700 transition"
                title="Schedule a group play night"
              >
                <Calendar className="w-4 h-4" /> Plan play
              </button>
              <button
                onClick={leave}
                className="ml-auto text-xs font-semibold text-slate-400 hover:text-rose-600 px-2 py-1 transition"
              >
                Leave
              </button>
            </>
          )}
        </div>

        {/* Members rail */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-[11px] uppercase tracking-wider font-bold text-slate-500">Members</h2>
              <AvatarStack
                size="sm"
                max={5}
                members={members.slice(0, 5).map(m => ({
                  id: m.user_id,
                  name: m.profiles?.full_name || null,
                  avatarUrl: m.profiles?.profile_picture_url || null,
                }))}
                totalCount={group.member_count}
              />
            </div>
            <button className="text-[11px] font-semibold text-emerald-700">See all</button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 sm:mx-0 px-4 sm:px-0">
            {members.slice(0, 16).map((m) => (
              <div key={m.user_id} className="flex flex-col items-center w-16 flex-shrink-0">
                <div className="relative w-14 h-14 rounded-full overflow-hidden bg-slate-100 ring-2 ring-white shadow-sm">
                  {m.profiles?.profile_picture_url ? (
                    <img src={m.profiles.profile_picture_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-600 to-emerald-800 text-white text-base font-bold">
                      {m.profiles?.full_name?.[0]?.toUpperCase() || '?'}
                    </div>
                  )}
                  {m.role === 'owner' && <Crown className="absolute -top-1 -right-1 w-4 h-4 text-amber-500 fill-amber-500 drop-shadow" />}
                  {m.role === 'admin' && <ShieldCheck className="absolute -top-1 -right-1 w-4 h-4 text-sky-600 fill-white drop-shadow" />}
                </div>
                <span className="text-[10px] text-slate-600 font-medium mt-1 truncate w-full text-center">{(m.profiles?.full_name || '').split(' ')[0]}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Posts in this group */}
        <section className="space-y-2">
          <h2 className="text-[11px] uppercase tracking-wider font-bold text-slate-500">Recent in this group</h2>
          {posts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-5 py-8 text-center">
              <p className="text-sm text-slate-700 font-semibold mb-1">No group posts yet</p>
              <p className="text-xs text-slate-500">Be the first — post tournament logistics, hype the squad, share the recap.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {posts.map((p) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-slate-200/60 bg-white p-4"
                >
                  <div className="flex gap-3">
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-100 flex-shrink-0">
                      {p.profiles?.profile_picture_url
                        ? <img src={p.profiles.profile_picture_url} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-600 to-emerald-800 text-white text-xs font-bold">{p.profiles?.full_name?.[0]?.toUpperCase() || '?'}</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-800">{p.profiles?.full_name || 'Member'}</div>
                      <p className="text-sm text-slate-700 leading-snug mt-0.5 whitespace-pre-wrap">{p.content}</p>
                      {p.media_urls && p.media_urls.length > 0 && (
                        <div className="mt-2 rounded-xl overflow-hidden bg-slate-100">
                          <img src={p.media_urls[0]} alt="" className="w-full max-h-56 object-cover" />
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
