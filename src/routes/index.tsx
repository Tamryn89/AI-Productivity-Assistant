import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, CheckCircle2, Clock, Sparkles as _s, Mail, ListChecks, NotebookPen, Wallet, MessageCircle, Plus, Bot } from "lucide-react";
import { useStore, fmtDate, daysUntil, money } from "@/lib/store";
import { PageHeader, ResponsibleAINotice, DemoBadge } from "@/components/AppShell";
import { Button } from "@/components/ui/button";

void _s;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — EventEase AI" },
      { name: "description", content: "Your event-planning overview: upcoming events, deadlines and AI tools." },
      { property: "og:title", content: "Dashboard — EventEase AI" },
      { property: "og:description", content: "Your event-planning overview: upcoming events, deadlines and AI tools." },
    ],
  }),
  component: Dashboard,
});

function Stat({ value, label, icon: Icon, tone }: { value: string; label: string; icon: any; tone: string }) {
  return (
    <div className="card-soft p-5">
      <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-3xl font-bold tracking-tight">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

const tools = [
  { to: "/invitations", label: "Write an invitation", icon: Mail },
  { to: "/tasks", label: "Generate a task plan", icon: ListChecks },
  { to: "/notes", label: "Summarize meeting notes", icon: NotebookPen },
  { to: "/budget", label: "Plan a budget", icon: Wallet },
  { to: "/assistant", label: "Ask the assistant", icon: MessageCircle },
] as const;

function Dashboard() {
  const { events, tasks } = useStore();
  const upcoming = events.filter((e) => daysUntil(e.date) >= 0 && e.status !== "Cancelled").sort((a, b) => a.date.localeCompare(b.date));
  const done = tasks.filter((t) => t.status === "completed").length;
  const open = tasks.filter((t) => t.status !== "completed").sort((a, b) => a.deadline.localeCompare(b.deadline));
  const hasDemo = events.some((e) => e.demo);
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <>
      <PageHeader
        title="Dashboard overview"
        subtitle="Everything you're planning, in one place."
        action={
          <Button asChild>
            <Link to="/events"><Plus className="mr-1 h-4 w-4" /> New event</Link>
          </Button>
        }
      />
      <ResponsibleAINotice />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat value={pad(upcoming.length)} label="Upcoming events" icon={CalendarDays} tone="bg-secondary text-primary" />
        <Stat value={pad(done)} label="Tasks completed" icon={CheckCircle2} tone="bg-success-soft text-success" />
        <Stat value={pad(open.length)} label="Tasks remaining" icon={Clock} tone="bg-warning-soft text-warning" />
        <Link to="/assistant" className="bg-brand rounded-[calc(var(--radius)+4px)] p-5 text-primary-foreground shadow-soft transition-transform hover:-translate-y-0.5">
          <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/20"><Bot className="h-5 w-5" /></div>
          <p className="text-3xl font-bold">AI</p>
          <p className="text-sm opacity-90">Planning assistant →</p>
        </Link>
      </div>
      {hasDemo && <p className="mt-3 text-xs text-muted-foreground">Illustrative sample data is shown. Reset or clear it in Settings.</p>}

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <section className="card-soft p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Upcoming events</h2>
            <Link to="/events" className="text-sm font-medium text-primary">View all</Link>
          </div>
          {upcoming.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No upcoming events. Create one to get started.</p>
          ) : (
            <ul className="divide-y">
              {upcoming.slice(0, 5).map((e) => (
                <li key={e.id} className="flex items-center gap-4 py-3">
                  <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                    <span className="text-[10px] font-semibold uppercase">{new Date(e.date + "T00:00").toLocaleString(undefined, { month: "short" })}</span>
                    <span className="text-lg font-bold leading-none">{new Date(e.date + "T00:00").getDate()}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{e.name} {e.demo && <DemoBadge />}</p>
                    <p className="truncate text-xs text-muted-foreground">{e.type} · {e.location} · {e.attendees} guests · {money(e.budget)}</p>
                  </div>
                  <span className="shrink-0 text-xs font-medium text-muted-foreground">in {daysUntil(e.date)}d</span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="card-soft p-5">
          <h2 className="mb-4 font-semibold">Quick actions</h2>
          <div className="flex flex-col gap-2">
            {tools.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to} className="flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors hover:border-primary/40 hover:bg-accent">
                <Icon className="h-4 w-4 text-primary" /> {label}
              </Link>
            ))}
          </div>
        </section>
      </div>

      <section className="card-soft mt-6 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">Task deadlines</h2>
          <Link to="/tasks" className="text-sm font-medium text-primary">Open planner</Link>
        </div>
        {open.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">All caught up.</p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {open.slice(0, 6).map((t) => {
              const ev = events.find((e) => e.id === t.eventId);
              const d = daysUntil(t.deadline);
              return (
                <li key={t.id} className="flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2.5 text-sm">
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{t.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">{ev?.name ?? "No event"}</span>
                  </span>
                  <span className={`shrink-0 text-xs font-semibold ${d < 0 ? "text-destructive" : d <= 3 ? "text-warning" : "text-muted-foreground"}`}>
                    {d < 0 ? "Overdue" : fmtDate(t.deadline)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
