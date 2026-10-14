import { Link, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  LayoutDashboard, CalendarDays, Mail, ListChecks, NotebookPen, Wallet, MessageCircle, Settings, Menu, PartyPopper, ShieldAlert, X,
} from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/events", label: "My Events", icon: CalendarDays },
  { to: "/invitations", label: "Invitations", icon: Mail },
  { to: "/tasks", label: "Task Planner", icon: ListChecks },
  { to: "/notes", label: "Meeting Notes", icon: NotebookPen },
  { to: "/budget", label: "Budget Assistant", icon: Wallet },
  { to: "/assistant", label: "AI Assistant", icon: MessageCircle },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

function NavList({ onNav }: { onNav?: () => void }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="flex flex-col gap-1">
      <p className="px-3 pb-2 text-[11px] font-semibold tracking-widest text-muted-foreground">MAIN MENU</p>
      {nav.map(({ to, label, icon: Icon }) => {
        const active = to === "/" ? path === "/" : path.startsWith(to);
        return (
          <Link
            key={to}
            to={to}
            onClick={onNav}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-muted"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-3 px-2">
      <span className="bg-brand flex h-9 w-9 items-center justify-center rounded-xl text-primary-foreground">
        <PartyPopper className="h-5 w-5" />
      </span>
      <span>
        <span className="block text-base font-bold leading-tight">EventEase AI</span>
        <span className="block text-xs text-muted-foreground">Planning workspace</span>
      </span>
    </Link>
  );
}

export function ResponsibleAINotice() {
  const [open, setOpen] = useState(true);
  if (!open) return null;
  return (
    <div className="mb-6 flex gap-3 rounded-xl border border-warning/30 bg-warning-soft p-4 text-sm">
      <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
      <div className="flex-1">
        <p className="font-semibold">Responsible AI Notice</p>
        <p className="mt-1 text-muted-foreground">
          EventEase AI generates suggestions, drafts and estimates to assist with event planning. AI-generated content may
          contain errors and should be reviewed before use. Budget figures are estimates, not guaranteed prices. The
          application does not confirm venue bookings, send invitations or make payments without the appropriate
          integration and user authorization. Avoid entering confidential or unnecessary personal information.
        </p>
      </div>
      <button onClick={() => setOpen(false)} aria-label="Dismiss notice" className="self-start text-muted-foreground hover:text-foreground">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col gap-8 border-r bg-sidebar p-5 lg:flex">
        <Brand />
        <NavList />
        <p className="mt-auto rounded-lg bg-muted p-3 text-xs text-muted-foreground">
          AI outputs are suggestions. Always review before using.
        </p>
      </aside>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-card/90 px-4 py-3 backdrop-blur lg:hidden">
        <Brand />
        <button onClick={() => setOpen(true)} aria-label="Open menu" className="rounded-lg p-2 hover:bg-muted">
          <Menu className="h-5 w-5" />
        </button>
      </header>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 bg-sidebar p-5">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <div className="mb-8"><Brand /></div>
          <NavList onNav={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
      <main className="lg:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">{children}</div>
      </main>
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

export function AIBadge({ children = "AI suggestion" }: { children?: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-secondary-foreground">
      ✦ {children}
    </span>
  );
}
export function DemoBadge() {
  return <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">Demo data</span>;
}

export const fieldClass =
  "flex h-10 w-full rounded-md border border-input bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
