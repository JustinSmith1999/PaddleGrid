import { useState } from 'react';
import { Bell, Send, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Props { facilityId?: string }

export default function AdminPushBlast({ facilityId }: Props) {
  const [audience, setAudience] = useState<'facility_followers' | 'facility_members'>('facility_followers');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [linkUrl, setLink] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const send = async () => {
    if (!facilityId || !title.trim() || !body.trim()) return;
    setBusy(true);
    setStatus(null);
    try {
      const { data, error } = await supabase.functions.invoke('web-push-fanout', {
        body: { audience, facility_id: facilityId, title, body, link_url: linkUrl || null },
      });
      if (error) throw error;
      const sent = (data as any)?.delivered ?? 0;
      const total = (data as any)?.recipients ?? 0;
      setStatus(`✓ Sent to ${sent} of ${total} recipients`);
      setTitle(''); setBody(''); setLink('');
    } catch (e: any) {
      setStatus('Error: ' + (e.message || 'Could not send'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="px-4 sm:px-6 py-5 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-5">
        <span className="inline-flex w-10 h-10 rounded-2xl bg-emerald-800 items-center justify-center text-white"><Bell className="w-5 h-5" /></span>
        <div>
          <h1 className="text-xl font-bold text-slate-900" style={{ fontFamily: "'Cinzel','Trajan Pro',serif" }}>Send push notification</h1>
          <p className="text-xs text-slate-500 mt-0.5">Goes to anyone in the audience who has opted into push.</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="rounded-xl border border-slate-200/70 bg-white p-3">
          <span className="text-[11px] uppercase tracking-wider font-bold text-slate-500">Audience</span>
          <div className="flex gap-2 mt-2">
            {(['facility_followers', 'facility_members'] as const).map(a => (
              <button key={a} onClick={() => setAudience(a)}
                className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold transition ${audience === a ? 'bg-emerald-800 text-white' : 'bg-slate-50 text-slate-600 ring-1 ring-slate-200'}`}>
                {a === 'facility_followers' ? 'Followers' : 'Members'}
              </button>
            ))}
          </div>
        </div>

        <input value={title} onChange={(e) => setTitle(e.target.value.slice(0, 60))} placeholder="Headline (60 chars max)" className="w-full px-3 py-3 rounded-xl border border-slate-200 text-sm font-bold" />
        <textarea value={body} onChange={(e) => setBody(e.target.value.slice(0, 200))} placeholder="What's the news? (200 chars max)" rows={4} className="w-full px-3 py-3 rounded-xl border border-slate-200 text-sm resize-none" />
        <input value={linkUrl} onChange={(e) => setLink(e.target.value)} placeholder="Link URL (optional) — e.g. https://paddlegrid.com/events/xyz" className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm" />

        <div className="rounded-xl bg-slate-50 ring-1 ring-slate-200 p-3">
          <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1">Preview</p>
          <p className="text-sm font-bold text-slate-900">{title || 'Your headline here'}</p>
          <p className="text-xs text-slate-600 mt-0.5">{body || 'Your message here'}</p>
        </div>

        <button onClick={send} disabled={busy || !title.trim() || !body.trim()}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-sm disabled:opacity-60">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Send blast
        </button>
        {status && <p className={`text-xs text-center ${status.startsWith('✓') ? 'text-emerald-700' : 'text-rose-700'}`}>{status}</p>}
      </div>
    </div>
  );
}
