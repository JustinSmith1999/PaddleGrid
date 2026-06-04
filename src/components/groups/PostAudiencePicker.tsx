import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Globe, Users, Check, ChevronDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Group {
  id: string;
  name: string;
  member_count: number;
}

interface Props {
  /** Currently selected group IDs */
  selectedGroupIds: string[];
  /** "Post to the feed" toggle (default true) */
  postToFeed: boolean;
  onChange: (selectedGroupIds: string[], postToFeed: boolean) => void;
  facilityId?: string;
}

/**
 * Audience picker for the composer. A pill bar with:
 *   • "Feed" toggle  (publishes to the public/facility feed)
 *   • Chips for each of your groups (toggleable)
 *
 * Plug into PostComposer like:
 *   const [groups, setGroups] = useState<string[]>([]);
 *   const [feed, setFeed] = useState(true);
 *   <PostAudiencePicker selectedGroupIds={groups} postToFeed={feed} onChange={(g,f)=>{ setGroups(g); setFeed(f); }} />
 *   // on submit: write social_posts row, then insert (post_id, group_id) into social_post_groups for each group
 */
export default function PostAudiencePicker({ selectedGroupIds, postToFeed, onChange, facilityId }: Props) {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!user) return;
      const { data } = await supabase
        .from('group_members')
        .select('group_id, groups!group_members_group_id_fkey(id, name, member_count, facility_id)')
        .eq('user_id', user.id);
      if (!mounted) return;
      const rows = ((data as any[]) || [])
        .map((r) => r.groups)
        .filter((g) => g && (!facilityId || g.facility_id === facilityId));
      setGroups(rows.map((g) => ({ id: g.id, name: g.name, member_count: g.member_count })));
    })();
    return () => { mounted = false; };
  }, [user?.id, facilityId]);

  const toggleGroup = (id: string) => {
    const next = selectedGroupIds.includes(id) ? selectedGroupIds.filter((x) => x !== id) : [...selectedGroupIds, id];
    onChange(next, postToFeed);
  };

  const summary = (() => {
    const parts: string[] = [];
    if (postToFeed) parts.push('Feed');
    selectedGroupIds.forEach((id) => {
      const g = groups.find((x) => x.id === id);
      if (g) parts.push(g.name);
    });
    if (!parts.length) return 'Nobody (pick at least one)';
    return parts.join(' · ');
  })();

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 px-3.5 py-2.5"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
            <Users className="w-3.5 h-3.5" />
          </div>
          <div className="text-left min-w-0">
            <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Post to</div>
            <div className="text-sm font-semibold text-slate-800 truncate">{summary}</div>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="border-t border-slate-200/60 px-3.5 py-3 space-y-2"
        >
          {/* Feed toggle */}
          <button
            type="button"
            onClick={() => onChange(selectedGroupIds, !postToFeed)}
            className={`w-full flex items-center gap-3 rounded-lg border px-3 py-2 text-left transition ${
              postToFeed ? 'border-emerald-400 bg-emerald-50/40' : 'border-slate-200 bg-white hover:border-emerald-300'
            }`}
          >
            <div className={`w-8 h-8 rounded-md flex items-center justify-center ${postToFeed ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-500'}`}>
              <Globe className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-slate-900">Feed</div>
              <div className="text-[11px] text-slate-500">Visible to everyone at the facility</div>
            </div>
            {postToFeed && <Check className="w-4 h-4 text-emerald-700 flex-shrink-0" />}
          </button>

          {/* Groups */}
          {groups.length === 0 ? (
            <p className="text-[11px] text-slate-400 italic px-1">You're not in any groups yet. Create or join one to post to them.</p>
          ) : (
            <div className="space-y-1.5">
              {groups.map((g) => {
                const active = selectedGroupIds.includes(g.id);
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => toggleGroup(g.id)}
                    className={`w-full flex items-center gap-3 rounded-lg border px-3 py-2 text-left transition ${
                      active ? 'border-emerald-400 bg-emerald-50/40' : 'border-slate-200 bg-white hover:border-emerald-300'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-md flex items-center justify-center ${active ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      <Users className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-slate-900 truncate">{g.name}</div>
                      <div className="text-[11px] text-slate-500">{g.member_count} members</div>
                    </div>
                    {active && <Check className="w-4 h-4 text-emerald-700 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
