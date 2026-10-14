import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Wand2, Save, Trash2, NotebookPen, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { summarizeNotes, type NoteSummary } from "@/lib/ai.functions";
import { useStore, update, uid, type Note } from "@/lib/store";
import { PageHeader, AIBadge, fieldClass } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/notes")({
  head: () => ({
    meta: [
      { title: "Meeting Notes Summarizer — EventEase AI" },
      { name: "description", content: "Turn planning meeting notes into decisions, action items and open questions." },
      { property: "og:title", content: "Meeting Notes Summarizer — EventEase AI" },
      { property: "og:description", content: "Turn planning meeting notes into decisions, action items and open questions." },
    ],
  }),
  component: NotesPage,
});

const SAMPLE = `Workshop planning sync – attendees: Lerato, Sipho, Anna
- Agreed to use Riverside Conference Centre if available on the 4th. Lerato to call them by Friday.
- Catering: buffet lunch preferred over plated. Budget max R12,000. Sipho to get 2 quotes.
- Anna will draft the invitation email.
- Still unsure whether we need a projector or the venue provides one.
- Discussed name badges, no decision.`;

function ListEditor({ label, items, onChange, hint }: { label: string; items: string[]; onChange: (v: string[]) => void; hint?: string }) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2"><h3 className="text-sm font-semibold">{label}</h3>{hint && <AIBadge>{hint}</AIBadge>}</div>
      <div className="grid gap-1.5">
        {items.map((it, i) => (
          <div key={i} className="flex gap-1">
            <Input value={it} onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))} className="h-9" />
            <Button size="icon" variant="ghost" className="h-9 w-9" aria-label="Remove" onClick={() => onChange(items.filter((_, j) => j !== i))}><X className="h-4 w-4" /></Button>
          </div>
        ))}
        {items.length === 0 && <p className="text-xs text-muted-foreground">None identified.</p>}
        <button className="flex items-center gap-1 text-xs font-medium text-primary" onClick={() => onChange([...items, ""])}><Plus className="h-3 w-3" />Add</button>
      </div>
    </div>
  );
}

function NotesPage() {
  const { events, notes } = useStore();
  const summarize = useServerFn(summarizeNotes);
  const [raw, setRaw] = useState("");
  const [title, setTitle] = useState("");
  const [eventId, setEventId] = useState("");
  const [sum, setSum] = useState<NoteSummary | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const run = async () => {
    setErr(""); setLoading(true);
    try {
      setSum(await summarize({ data: { notes: raw } }));
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };
  const save = () => {
    if (!sum) return;
    const note: Note = { id: editingId ?? uid(), eventId, title: title.trim() || "Planning meeting", raw, summary: sum, createdAt: new Date().toISOString() };
    update((s) => ({ ...s, notes: editingId ? s.notes.map((n) => (n.id === editingId ? note : n)) : [note, ...s.notes] }));
    toast.success("Summary saved");
    setEditingId(note.id);
  };
  const open = (n: Note) => { setEditingId(n.id); setRaw(n.raw); setTitle(n.title); setEventId(n.eventId); setSum(n.summary); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const reset = () => { setEditingId(null); setRaw(""); setTitle(""); setSum(null); };

  return (
    <>
      <PageHeader title="Meeting Notes Summarizer" subtitle="Paste planning notes. Get decisions, action items and open questions."
        action={editingId ? <Button variant="outline" onClick={reset}><Plus className="mr-1 h-4 w-4" />New summary</Button> : undefined} />
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card-soft grid content-start gap-4 p-5">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Title</Label><Input placeholder="Planning meeting" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
            <div><Label>Related event</Label>
              <select className={fieldClass} value={eventId} onChange={(e) => setEventId(e.target.value)}>
                <option value="">None</option>
                {events.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between"><Label>Meeting notes</Label><button className="text-xs font-medium text-primary" onClick={() => setRaw(SAMPLE)}>Use sample notes</button></div>
            <Textarea className="min-h-72" value={raw} onChange={(e) => setRaw(e.target.value)} placeholder="Paste your meeting notes here…" />
          </div>
          {err && <p className="text-sm text-destructive">{err}</p>}
          <Button onClick={run} disabled={loading || raw.trim().length < 20}>{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}Summarize notes</Button>
        </section>

        <section className="card-soft p-5">
          {!sum ? (
            <div className="flex min-h-72 flex-col items-center justify-center gap-3 text-center text-muted-foreground">
              <NotebookPen className="h-10 w-10" />
              <p className="text-sm">{loading ? "Reading your notes…" : "The structured summary will appear here."}</p>
            </div>
          ) : (
            <div className="grid gap-5">
              <div className="flex items-center justify-between"><AIBadge>AI summary — editable</AIBadge><Button size="sm" onClick={save}><Save className="mr-1 h-4 w-4" />Save</Button></div>
              <div><h3 className="mb-2 text-sm font-semibold">Executive summary</h3><Textarea value={sum.executive_summary} onChange={(e) => setSum({ ...sum, executive_summary: e.target.value })} /></div>
              <ListEditor label="Key decisions" items={sum.decisions} onChange={(v) => setSum({ ...sum, decisions: v })} />
              <div>
                <h3 className="mb-2 text-sm font-semibold">Action items</h3>
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted text-left text-xs text-muted-foreground"><tr><th className="p-2">Task</th><th className="p-2">Owner</th><th className="p-2">Deadline</th></tr></thead>
                    <tbody>
                      {sum.action_items.map((a, i) => (
                        <tr key={i} className="border-t">
                          {(["task", "owner", "deadline"] as const).map((k) => (
                            <td key={k} className="p-1"><Input className={`h-8 border-transparent shadow-none hover:border-input ${a[k] === "Not specified" ? "text-muted-foreground italic" : ""}`} value={a[k]} onChange={(e) => setSum({ ...sum, action_items: sum.action_items.map((x, j) => (j === i ? { ...x, [k]: e.target.value } : x)) })} /></td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <ListEditor label="Unresolved questions" items={sum.unresolved_questions} onChange={(v) => setSum({ ...sum, unresolved_questions: v })} />
              <div className="rounded-lg bg-secondary/50 p-4">
                <p className="mb-3 text-xs text-muted-foreground">The following are AI recommendations, not taken from your notes.</p>
                <div className="grid gap-4">
                  <ListEditor label="Potential risks" hint="Recommendation" items={sum.risks} onChange={(v) => setSum({ ...sum, risks: v })} />
                  <ListEditor label="Follow-up recommendations" hint="Recommendation" items={sum.recommendations} onChange={(v) => setSum({ ...sum, recommendations: v })} />
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      <section className="mt-8">
        <h2 className="mb-3 font-semibold">Saved summaries</h2>
        {notes.length === 0 ? <p className="text-sm text-muted-foreground">No saved summaries yet.</p> : (
          <div className="grid gap-3 md:grid-cols-2">
            {notes.map((n) => (
              <div key={n.id} className="card-soft flex items-start gap-3 p-4">
                <button className="min-w-0 flex-1 text-left" onClick={() => open(n)}>
                  <p className="font-medium">{n.title}</p>
                  <p className="text-xs text-muted-foreground">{new Date(n.createdAt).toLocaleDateString()} · {events.find((e) => e.id === n.eventId)?.name ?? "No event"} · {n.summary?.action_items.length ?? 0} action items</p>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{n.summary?.executive_summary}</p>
                </button>
                <Button size="icon" variant="ghost" aria-label="Delete" onClick={() => { update((s) => ({ ...s, notes: s.notes.filter((x) => x.id !== n.id) })); if (editingId === n.id) reset(); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
