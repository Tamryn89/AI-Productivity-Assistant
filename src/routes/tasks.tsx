import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Wand2, Plus, Trash2, AlertTriangle, Check } from "lucide-react";
import { toast } from "sonner";
import { generatePlan, type PlannedTask } from "@/lib/ai.functions";
import { useStore, update, uid, fmtDate, daysUntil, money, type Task, type TaskStatus } from "@/lib/store";
import { PageHeader, AIBadge, fieldClass } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/tasks")({
  head: () => ({
    meta: [
      { title: "AI Task Planner — EventEase AI" },
      { name: "description", content: "Generate prioritized preparation checklists and timelines for your events." },
      { property: "og:title", content: "AI Task Planner — EventEase AI" },
      { property: "og:description", content: "Generate prioritized preparation checklists and timelines for your events." },
    ],
  }),
  component: TasksPage,
});

const prioTone = { High: "bg-destructive/10 text-destructive", Medium: "bg-warning-soft text-warning", Low: "bg-muted text-muted-foreground" };
const STAT: TaskStatus[] = ["pending", "in-progress", "completed"];

function TasksPage() {
  const { events, tasks } = useStore();
  const gen = useServerFn(generatePlan);
  const [eventId, setEventId] = useState(events[0]?.id ?? "");
  const [resources, setResources] = useState("");
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<{ tasks: PlannedTask[]; warnings: string[] } | null>(null);
  const [filter, setFilter] = useState<"all" | TaskStatus>("all");
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState("");
  const ev = events.find((e) => e.id === eventId);

  const run = async () => {
    if (!ev) return toast.error("Create or select an event first.");
    if (daysUntil(ev.date) < 0) return toast.error("This event's date has passed.");
    setLoading(true);
    try {
      setDraft(await gen({ data: { type: ev.type, name: ev.name, date: ev.date, budget: ev.budget, attendees: ev.attendees, resources } }));
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };
  const accept = () => {
    if (!draft || !ev) return;
    const add: Task[] = draft.tasks.map((t) => ({
      id: uid(), eventId: ev.id, title: t.title,
      description: [t.description, t.dependencies && `Depends on: ${t.dependencies}`, t.estimated_cost != null && `Est. cost: ${money(t.estimated_cost)} (estimate)`, `Done when: ${t.completion_criteria}`].filter(Boolean).join(" · "),
      priority: t.priority, deadline: /^\d{4}-\d{2}-\d{2}$/.test(t.deadline) ? t.deadline : ev.date, status: "pending", ai: true,
    }));
    update((s) => ({ ...s, tasks: [...s.tasks, ...add] }));
    setDraft(null);
    toast.success(`${add.length} tasks added to your plan`);
  };
  const setTask = (id: string, patch: Partial<Task>) => update((s) => ({ ...s, tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) }));
  const del = (id: string) => update((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== id) }));
  const addManual = () => {
    if (!ev || !newTitle.trim() || !newDate) return toast.error("Enter a task name and deadline.");
    update((s) => ({ ...s, tasks: [...s.tasks, { id: uid(), eventId: ev.id, title: newTitle.trim(), description: "", priority: "Medium", deadline: newDate, status: "pending" }] }));
    setNewTitle(""); setNewDate("");
  };

  const list = tasks.filter((t) => t.eventId === eventId && (filter === "all" || t.status === filter)).sort((a, b) => a.deadline.localeCompare(b.deadline));

  return (
    <>
      <PageHeader title="AI Event Task Planner" subtitle="Generate a preparation checklist, then track it on a timeline." />
      <section className="card-soft mb-6 grid gap-4 p-5 md:grid-cols-[1fr_1.5fr_auto] md:items-end">
        <div><Label>Event</Label>
          <select className={fieldClass} value={eventId} onChange={(e) => setEventId(e.target.value)}>
            {events.length === 0 && <option value="">No events yet</option>}
            {events.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>
        <div><Label>Available resources (optional)</Label><Input placeholder="e.g. in-house AV team, 2 volunteers" value={resources} onChange={(e) => setResources(e.target.value)} /></div>
        <Button onClick={run} disabled={loading || !ev}>{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}Generate plan</Button>
        {ev && <p className="text-xs text-muted-foreground md:col-span-3">{ev.type} · {fmtDate(ev.date)} · {ev.attendees} attendees · {money(ev.budget)}</p>}
      </section>

      {draft && (
        <section className="card-soft mb-6 border-primary/30 p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2"><h2 className="font-semibold">Suggested plan</h2><AIBadge /></div>
            <div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => setDraft(null)}>Discard</Button><Button size="sm" onClick={accept}><Check className="mr-1 h-4 w-4" />Add to my tasks</Button></div>
          </div>
          {draft.warnings.length > 0 && (
            <div className="mb-3 rounded-lg bg-warning-soft p-3 text-sm">
              <p className="mb-1 flex items-center gap-2 font-medium"><AlertTriangle className="h-4 w-4 text-warning" />Needs your attention</p>
              <ul className="list-disc pl-5 text-muted-foreground">{draft.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
            </div>
          )}
          <ul className="divide-y text-sm">
            {draft.tasks.map((t, i) => (
              <li key={i} className="py-2.5">
                <div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${prioTone[t.priority]}`}>{t.priority}</span><span className="font-medium">{t.title}</span><span className="ml-auto text-xs text-muted-foreground">by {t.deadline}{t.estimated_cost != null ? ` · est. ${money(t.estimated_cost)}` : ""}</span></div>
                <p className="mt-1 text-muted-foreground">{t.description}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card-soft p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold">Preparation timeline</h2>
          <div className="flex gap-1 rounded-lg bg-muted p-1 text-xs">
            {(["all", ...STAT] as const).map((s) => (
              <button key={s} onClick={() => setFilter(s)} className={`rounded-md px-3 py-1.5 font-medium capitalize ${filter === s ? "bg-card shadow-soft" : "text-muted-foreground"}`}>{s}</button>
            ))}
          </div>
        </div>
        <div className="mb-4 flex flex-col gap-2 sm:flex-row">
          <Input placeholder="Add a task…" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
          <Input type="date" className="sm:w-44" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
          <Button variant="outline" onClick={addManual} disabled={!ev}><Plus className="mr-1 h-4 w-4" />Add</Button>
        </div>
        {list.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">No tasks yet. Generate a plan or add one manually.</p>
        ) : (
          <ol className="relative ml-2 border-l pl-6">
            {list.map((t) => {
              const d = daysUntil(t.deadline);
              return (
                <li key={t.id} className="relative mb-4">
                  <span className={`absolute -left-[31px] top-3 h-3 w-3 rounded-full border-2 border-card ${t.status === "completed" ? "bg-success" : d < 0 ? "bg-destructive" : "bg-primary"}`} />
                  <div className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-start">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Input value={t.title} onChange={(e) => setTask(t.id, { title: e.target.value })} className={`h-8 border-transparent px-1 font-medium shadow-none hover:border-input ${t.status === "completed" ? "text-muted-foreground line-through" : ""}`} />
                      </div>
                      {t.description && <p className="mt-1 px-1 text-xs text-muted-foreground">{t.description}</p>}
                      <div className="mt-2 flex flex-wrap items-center gap-2 px-1 text-xs">
                        {t.ai && <AIBadge>AI suggested</AIBadge>}
                        <span className={d < 0 && t.status !== "completed" ? "font-semibold text-destructive" : "text-muted-foreground"}>Due {fmtDate(t.deadline)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <select className={`${fieldClass} h-8 w-24 text-xs`} value={t.priority} onChange={(e) => setTask(t.id, { priority: e.target.value as Task["priority"] })}>
                        <option>High</option><option>Medium</option><option>Low</option>
                      </select>
                      <select className={`${fieldClass} h-8 w-32 text-xs`} value={t.status} onChange={(e) => setTask(t.id, { status: e.target.value as TaskStatus })}>
                        {STAT.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Delete task" onClick={() => del(t.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </>
  );
}
