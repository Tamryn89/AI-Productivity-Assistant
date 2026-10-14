import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Pencil, Trash2, MapPin, Users, Wallet, Search, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { useStore, update, uid, validateEvent, fmtDate, daysUntil, money, type EventItem, type EventStatus } from "@/lib/store";
import { PageHeader, DemoBadge, fieldClass } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/events")({
  head: () => ({
    meta: [
      { title: "My Events — EventEase AI" },
      { name: "description", content: "Create, edit and track your events, venues, dates and budgets." },
      { property: "og:title", content: "My Events — EventEase AI" },
      { property: "og:description", content: "Create, edit and track your events, venues, dates and budgets." },
    ],
  }),
  component: EventsPage,
});

const TYPES = ["Conference", "Meeting", "Workshop", "Birthday", "Wedding", "Party", "Other"];
const STATUSES: EventStatus[] = ["Planning", "Confirmed", "Completed", "Cancelled"];
const empty: Partial<EventItem> = { name: "", type: "Workshop", date: "", time: "09:00", location: "", attendees: 20, budget: 10000, description: "", status: "Planning" };

const statusTone: Record<EventStatus, string> = {
  Planning: "bg-secondary text-secondary-foreground",
  Confirmed: "bg-success-soft text-success",
  Completed: "bg-muted text-muted-foreground",
  Cancelled: "bg-destructive/10 text-destructive",
};

function EventsPage() {
  const { events, tasks } = useStore();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("All");
  const [form, setForm] = useState<Partial<EventItem> | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const list = events
    .filter((e) => (filter === "All" || e.status === filter) && `${e.name} ${e.location} ${e.type}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => a.date.localeCompare(b.date));

  const save = () => {
    if (!form) return;
    const errs = validateEvent(form);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    if (form.id) {
      update((s) => ({ ...s, events: s.events.map((e) => (e.id === form.id ? ({ ...e, ...form, demo: false } as EventItem) : e)) }));
      toast.success("Event updated");
    } else {
      update((s) => ({ ...s, events: [...s.events, { ...(form as EventItem), id: uid() }] }));
      toast.success("Event created");
    }
    setForm(null);
  };
  const remove = (id: string) => {
    if (!confirm("Delete this event and its tasks?")) return;
    update((s) => ({ ...s, events: s.events.filter((e) => e.id !== id), tasks: s.tasks.filter((t) => t.eventId !== id) }));
    toast.success("Event deleted");
  };
  const set = (k: keyof EventItem, v: any) => setForm((f) => ({ ...f, [k]: v }));
  const Err = ({ k }: { k: string }) => (errors[k] ? <p className="mt-1 text-xs text-destructive">{errors[k]}</p> : null);

  return (
    <>
      <PageHeader
        title="My Events"
        subtitle="Organize dates, venues and event details."
        action={<Button onClick={() => { setErrors({}); setForm({ ...empty }); }}><Plus className="mr-1 h-4 w-4" /> New event</Button>}
      />
      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search events…" className="bg-card pl-9" />
        </div>
        <select className={`${fieldClass} sm:w-44`} value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option>All</option>
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      {list.length === 0 ? (
        <div className="card-soft flex flex-col items-center gap-3 py-16 text-center">
          <CalendarDays className="h-10 w-10 text-muted-foreground" />
          <p className="font-medium">No events found</p>
          <p className="text-sm text-muted-foreground">Create your first event to start planning.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {list.map((e) => {
            const et = tasks.filter((t) => t.eventId === e.id);
            const pct = et.length ? Math.round((et.filter((t) => t.status === "completed").length / et.length) * 100) : 0;
            const d = daysUntil(e.date);
            return (
              <article key={e.id} className="card-soft flex flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusTone[e.status]}`}>{e.status}</span>
                      <span className="text-xs text-muted-foreground">{e.type}</span>
                      {e.demo && <DemoBadge />}
                    </div>
                    <h3 className="text-lg font-semibold">{e.name}</h3>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" aria-label="Edit" onClick={() => { setErrors({}); setForm({ ...e }); }}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" aria-label="Delete" onClick={() => remove(e.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{e.description}</p>
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <span className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-primary" />{fmtDate(e.date)} · {e.time}</span>
                  <span className="flex items-center gap-2 truncate"><MapPin className="h-4 w-4 text-primary" />{e.location}</span>
                  <span className="flex items-center gap-2"><Users className="h-4 w-4 text-primary" />{e.attendees} attendees</span>
                  <span className="flex items-center gap-2"><Wallet className="h-4 w-4 text-primary" />{money(e.budget)}</span>
                </div>
                <div className="mt-auto pt-4">
                  <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                    <span>{et.length} tasks · {pct}% done</span>
                    <span>{d >= 0 ? `${d} days to go` : "Past"}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="bg-brand h-full" style={{ width: `${pct}%` }} /></div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Dialog open={!!form} onOpenChange={(o) => !o && setForm(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader><DialogTitle>{form?.id ? "Edit event" : "Create event"}</DialogTitle></DialogHeader>
          {form && (
            <div className="grid gap-4">
              <div><Label>Event name *</Label><Input value={form.name} onChange={(e) => set("name", e.target.value)} /><Err k="name" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Type *</Label><select className={fieldClass} value={form.type} onChange={(e) => set("type", e.target.value)}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select></div>
                <div><Label>Status</Label><select className={fieldClass} value={form.status} onChange={(e) => set("status", e.target.value)}>{STATUSES.map((t) => <option key={t}>{t}</option>)}</select></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Date *</Label><Input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} /><Err k="date" /></div>
                <div><Label>Time</Label><Input type="time" value={form.time} onChange={(e) => set("time", e.target.value)} /></div>
              </div>
              <div><Label>Location *</Label><Input value={form.location} onChange={(e) => set("location", e.target.value)} /><Err k="location" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Attendees *</Label><Input type="number" min={1} value={form.attendees} onChange={(e) => set("attendees", Number(e.target.value))} /><Err k="attendees" /></div>
                <div><Label>Budget (R)</Label><Input type="number" min={0} value={form.budget} onChange={(e) => set("budget", Number(e.target.value))} /><Err k="budget" /></div>
              </div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => set("description", e.target.value)} /></div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setForm(null)}>Cancel</Button>
                <Button onClick={save}>{form.id ? "Save changes" : "Create event"}</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
