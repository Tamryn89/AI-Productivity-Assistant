import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Copy, Loader2, RefreshCw, Wand2, Mail } from "lucide-react";
import { toast } from "sonner";
import { generateInvitation } from "@/lib/ai.functions";
import { useStore, fmtDate } from "@/lib/store";
import { PageHeader, AIBadge, fieldClass } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/invitations")({
  head: () => ({
    meta: [
      { title: "Smart Invitations — EventEase AI" },
      { name: "description", content: "Generate editable invitation and reminder emails in formal, friendly or persuasive tones." },
      { property: "og:title", content: "Smart Invitations — EventEase AI" },
      { property: "og:description", content: "Generate editable invitation and reminder emails with AI." },
    ],
  }),
  component: InvitationsPage,
});

const TONES = ["Formal", "Friendly", "Persuasive"];

function InvitationsPage() {
  const { events } = useStore();
  const gen = useServerFn(generateInvitation);
  const [f, setF] = useState({ name: "", type: "", datetime: "", location: "", audience: "", tone: "Formal", details: "" });
  const [out, setOut] = useState<{ subject: string; body: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const pick = (id: string) => {
    const e = events.find((x) => x.id === id);
    if (e) setF((p) => ({ ...p, name: e.name, type: e.type, datetime: `${fmtDate(e.date)} at ${e.time}`, location: e.location, details: e.description }));
  };
  const run = async () => {
    if (!f.name.trim()) return setErr("Event name is required.");
    setErr(""); setLoading(true);
    try {
      setOut(await gen({ data: f }));
      toast.success("Invitation drafted — review before sending");
    } catch (e: any) {
      setErr(e.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };
  const copy = () => {
    if (!out) return;
    navigator.clipboard.writeText(`Subject: ${out.subject}\n\n${out.body}`);
    toast.success("Copied to clipboard");
  };

  return (
    <>
      <PageHeader title="Smart Invitation Generator" subtitle="Draft professional invitations and reminders. You edit and send — we never send on your behalf." />
      <div className="grid gap-6 lg:grid-cols-5">
        <section className="card-soft grid gap-4 p-5 lg:col-span-2">
          <div><Label>Fill from event</Label>
            <select className={fieldClass} defaultValue="" onChange={(e) => pick(e.target.value)}>
              <option value="" disabled>Choose an event…</option>
              {events.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
          <div><Label>Event name *</Label><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Event type</Label><Input value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })} /></div>
            <div><Label>Date & time</Label><Input value={f.datetime} onChange={(e) => setF({ ...f, datetime: e.target.value })} /></div>
          </div>
          <div><Label>Location</Label><Input value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} /></div>
          <div><Label>Audience</Label><Input placeholder="e.g. team leads, family & friends" value={f.audience} onChange={(e) => setF({ ...f, audience: e.target.value })} /></div>
          <div><Label>Tone</Label>
            <div className="grid grid-cols-3 gap-2">
              {TONES.map((t) => (
                <button key={t} onClick={() => setF({ ...f, tone: t })} className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${f.tone === t ? "border-primary bg-secondary text-secondary-foreground" : "hover:bg-muted"}`}>{t}</button>
              ))}
            </div>
          </div>
          <div><Label>Additional details</Label><Textarea value={f.details} onChange={(e) => setF({ ...f, details: e.target.value })} /></div>
          {err && <p className="text-sm text-destructive">{err}</p>}
          <Button onClick={run} disabled={loading}>{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}Generate invitation</Button>
          <p className="text-xs text-muted-foreground">Missing details are left as [PLACEHOLDERS] — the AI won't invent them.</p>
        </section>
        <section className="card-soft p-5 lg:col-span-3">
          {!out ? (
            <div className="flex h-full min-h-72 flex-col items-center justify-center gap-3 text-center text-muted-foreground">
              <Mail className="h-10 w-10" />
              <p className="text-sm">{loading ? "Drafting your invitation…" : "Your generated invitation will appear here."}</p>
            </div>
          ) : (
            <div className="grid gap-3">
              <div className="flex items-center justify-between"><AIBadge>AI draft — editable</AIBadge>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={run} disabled={loading}><RefreshCw className="mr-1 h-3.5 w-3.5" />Regenerate</Button>
                  <Button size="sm" onClick={copy}><Copy className="mr-1 h-3.5 w-3.5" />Copy</Button>
                </div>
              </div>
              <div><Label>Subject</Label><Input value={out.subject} onChange={(e) => setOut({ ...out, subject: e.target.value })} /></div>
              <div><Label>Body</Label><Textarea className="min-h-96 leading-relaxed" value={out.body} onChange={(e) => setOut({ ...out, body: e.target.value })} /></div>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
