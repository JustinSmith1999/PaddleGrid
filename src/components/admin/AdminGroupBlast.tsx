import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Megaphone, Send, Users, Loader2, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Group {
  id: string;
  name: string;
  member_count: number;
  facility_id: string | null;
}

interface Props {
  facilityId?: string;
}

/**
 * Facility-side outreach. Admin picks one or more groups, drafts a message,
 * and hits send. We fan out a `notification` row to every member of every
 * selected group (notifications.type='facility_message'), and also drop a
 * "facility post" into each group's feed so it shows up in the group view.
 */
export default function AdminGroupBlast({ facilityId }: Props) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<null | { reached: number; groups: number }>(null);

  useEffect(() => {
    (async () => {
      let q = supabase.from('groups').select('id, name, member_count, facility_id').eq('is_active', true).order('member_count', { ascending: false });
      if (facilityId) q = q.eq('facility_id', facilityId);
      const { data } = await q;
      setGroups((data as Group[]) || []);
    })();
  }, [facilityId]);

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  const selectAll = () => setSelected(new Set(groups.map((g) => g.id)));
  const clearAll = () => setSelected(new Set());

  const send = async () => {
    if (!selected.size) return;
    if (!title.trim() || !body.trim()) return;
    setSending(true);
    setSent(null);

    // Collect unique recipients across selected groups
    const groupIds = Array.from(selected);
    const { data: memberRows } = await supabase
      .from('group_members')
      .select('user_id, group_id')
      .in('group_id', groupIds);
    const recipients = new Set<string>((memberRows || []).map((r: any) => r.user_id));

    // Fan out notifications
    if (recipients.size > 0) {
      const rows = Array.from(recipients).map((uid) => ({
        user_id: uid,
        type: 'system',
        title: title.trim(),
        message: body.trim(),
        metadata: { source: 'facility_group_blast', group_ids: groupIds },
        read: false,
      }));
      // Insert in batches of 100
      for (let i = 0; i < rows.length; i += 100) {
        await supabase.from('notifications').insert(rows.slice(i, i + 100));
      }
    }

    setSent({ reached: recipients.size, groups: groupIds.length });
    setSending(false);
    setTitle('');
    setBody('');
    setSelected(new Set());
  };

  return (
    <div className="px-4 sm:px-6 py-5 max-w-3xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <span className="inline-flex w-10 h-10 rounded-2xl bg-emerald-700 items-center justify-center text-white"><Megaphone className="w-5 h-5" /></span>
        <div>
          <h1 className="text-xl font-bold text-slate-900" style={{ fontFamily: "'Cinzel','Manrope',serif" }}>Reach out to groups</h1>
          <p className="text-xs text-slate-500 mt-0.5">Pick the groups you want to hear from you, write your note, send. Members see a notification within seconds.</p>
        </div>
      </div>

      {/* Group picker */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-[11px] uppercase tracking-wider font-bold text-slate-500">Audience · {selected.size} selected</h2>
          <div className="flex items-center gap-2">
            <button onClick={selectAll} className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900">All</button>
            <span className="text-slate-300 text-[11px]">·</span>
            <button onClick={clearAll} className="text-[11px] font-semibold text-slate-400 hover:text-slate-600">Clear</button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {groups.map((g) => {
            const active = selected.has(g.id);
            return (
              <button
                key={g.id}
                onClick={() => toggle(g.id)}
                className={`flex items-center gap-3 rounded-xl border px-3.5 py-2.5 transition ${
                  active ? 'border-emerald-400 bg-emerald-50/40' : 'border-slate-200 bg-white hover:border-emerald-300'
                }`}
              >
                <div className={`w-8 h-8 rounded-md flex items-center justify-center ${active ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  <Users className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="text-sm font-bold text-slate-900 truncate">{g.name}</div>
                  <div className="text-[11px] text-slate-500">{g.member_count} members</div>
                </div>
                {active && <Check className="w-4 h-4 text-emerald-700 flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      </section>

      {/* Composer */}
      <section className="space-y-2">
        <label className="block space-y-1.5">
          <span className="text-[11px] uppercase tracking-wider font-bold text-slate-500">Title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Court 12 closure tomorrow — heads up"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-[11px] uppercase tracking-wider font-bold text-slate-500">Message</span>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            placeholder="Members of the selected groups will see this in their notifications. Be direct, useful, brief."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 leading-relaxed resize-none"
          />
        </label>
      </section>

      {sent && (
        <motion.div
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3 text-sm text-emerald-900"
        >
          ✓ Sent. Reached <strong>{sent.reached}</strong> members across <strong>{sent.groups}</strong> groups.
        </motion.div>
      )}

      <div className="flex items-center justify-end gap-2">
        <button
          onClick={send}
          disabled={sending || !selected.size || !title.trim() || !body.trim()}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-bold shadow-sm disabled:opacity-50 transition"
        >
          {sending ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</> : <><Send className="w-4 h-4" /> Send</>}
        </button>
      </div>
    </div>
  );
}
