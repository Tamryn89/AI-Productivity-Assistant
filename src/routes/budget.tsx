import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Wand2, AlertTriangle, PiggyBank, Wallet, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { planBudget, type BudgetResult } from "@/lib/ai.functions";
import { useStore, money } from "@/lib/store";
import { PageHeader, AIBadge, fieldClass } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/budget")({
  head: () => ({
    meta: [
      { title: "AI Budget Assistant — EventEase AI" },
      { name: "description", content: "Get estimated spending plans for venue, catering, decor and more." },
      { property: "og:title", content: "AI Budget Assistant — EventEase AI" },
      { property: "og:description", content: "Get estimated spending plans for venue, catering, decor and more." },
    ],
  }),
  component: BudgetPage,
});

const COLORS = ["bg-chart-1", "bg-chart-2", "bg-chart-3", "bg-chart-4", "bg-chart-5", "bg-chart-6"];

function BudgetPage() {
  const { events } = useStore();
  const plan = useServerFn(planBudget);
  const [f, setF] = useState({ total: 60000, eventType: "Workshop", attendees: 50, requirements: "Venue for a full day, lunch and teas, projector, simple decor" });
  const [res, setRes] = useState<BudgetResult | null>(null);
  const [loading, setLoading] = useState(false);

  const pick = (id: string) => {
    const e = events.find((x) => x.id === id);
    if (e) setF({ ...f, total: e.budget, eventType: e.type, attendees: e.attendees, requirements: e.description });
  };
  const run = async () => {
    setLoading(true);
    try {
      setRes(await plan({ data: { ...f, currency: "ZAR (R)" } }));
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };
  const allocated = res?.allocations.reduce((s, a) => s + (Number(a.amount) || 0), 0) ?? 0;
  const remaining = f.total - allocated;
  const setAmt = (i: number, patch: Partial<BudgetResult["allocations"][0]>) => res && setRes({ ...res, allocations: res.allocations.map((a, j) => (j === i ? { ...a, ...patch } : a)) });

  return (
    <>
      <PageHeader title="AI Budget Assistant" subtitle="Estimate and organize event expenses. All amounts are estimates, not supplier quotes." />
      <div className="grid gap-6 lg:grid-cols-5">
        <section className="card-soft grid content-start gap-4 p-5 lg:col-span-2">
          <div><Label>Fill from event</Label>
            <select className={fieldClass} defaultValue="" onChange={(e) => pick(e.target.value)}>
              <option value="" disabled>Choose an event…</option>
              {events.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
          <div><Label>Total budget (R) *</Label><Input type="number" min={1} value={f.total} onChange={(e) => setF({ ...f, total: Number(e.target.value) })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Event type</Label><Input value={f.eventType} onChange={(e) => setF({ ...f, eventType: e.target.value })} /></div>
            <div><Label>Attendees</Label><Input type="number" min={1} value={f.attendees} onChange={(e) => setF({ ...f, attendees: Number(e.target.value) })} /></div>
          </div>
          <div><Label>Requirements</Label><Textarea className="min-h-28" value={f.requirements} onChange={(e) => setF({ ...f, requirements: e.target.value })} /></div>
          <Button onClick={run} disabled={loading || !(f.total > 0)}>{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}Suggest spending plan</Button>
        </section>

        <section className="card-soft p-5 lg:col-span-3">
          {!res ? (
            <div className="flex min-h-72 flex-col items-center justify-center gap-3 text-center text-muted-foreground">
              <Wallet className="h-10 w-10" />
              <p className="text-sm">{loading ? "Building your spending plan…" : "Your estimated allocation will appear here."}</p>
            </div>
          ) : (
            <div className="grid gap-5">
              <div className="flex items-center justify-between"><AIBadge>Estimates — editable</AIBadge></div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-lg bg-muted p-3"><p className="text-xs text-muted-foreground">Budget</p><p className="font-bold">{money(f.total)}</p></div>
                <div className="rounded-lg bg-muted p-3"><p className="text-xs text-muted-foreground">Allocated</p><p className="font-bold">{money(allocated)}</p></div>
                <div className={`rounded-lg p-3 ${remaining < 0 ? "bg-destructive/10 text-destructive" : "bg-success-soft text-success"}`}><p className="text-xs">Remaining</p><p className="font-bold">{money(remaining)}</p></div>
              </div>
              {remaining < 0 && <p className="flex items-center gap-2 text-sm font-medium text-destructive"><AlertTriangle className="h-4 w-4" />Allocations exceed your budget by {money(-remaining)}.</p>}
              <div className="flex h-3 overflow-hidden rounded-full bg-muted">
                {res.allocations.map((a, i) => <div key={i} className={COLORS[i % COLORS.length]} style={{ width: `${Math.max(0, (a.amount / Math.max(f.total, allocated)) * 100)}%` }} />)}
              </div>
              <ul className="grid gap-2">
                {res.allocations.map((a, i) => (
                  <li key={i} className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center">
                    <span className={`h-3 w-3 shrink-0 rounded-full ${COLORS[i % COLORS.length]}`} />
                    <div className="min-w-0 flex-1">
                      <Input className="h-8 border-transparent px-1 font-medium shadow-none hover:border-input" value={a.category} onChange={(e) => setAmt(i, { category: e.target.value })} />
                      <p className="px-1 text-xs text-muted-foreground">{a.rationale}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">≈ R</span>
                      <Input type="number" className="h-8 w-28" value={a.amount} onChange={(e) => setAmt(i, { amount: Number(e.target.value) })} />
                      <span className="w-10 text-right text-xs text-muted-foreground">{f.total ? Math.round((a.amount / f.total) * 100) : 0}%</span>
                      <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Remove" onClick={() => setRes({ ...res, allocations: res.allocations.filter((_, j) => j !== i) })}><X className="h-4 w-4" /></Button>
                    </div>
                  </li>
                ))}
              </ul>
              <button className="flex items-center gap-1 text-sm font-medium text-primary" onClick={() => setRes({ ...res, allocations: [...res.allocations, { category: "New category", amount: 0, rationale: "Added by you" }] })}><Plus className="h-4 w-4" />Add category</button>
              {res.warnings.length > 0 && (
                <div className="rounded-lg bg-warning-soft p-3 text-sm">
                  <p className="mb-1 flex items-center gap-2 font-medium"><AlertTriangle className="h-4 w-4 text-warning" />Watch out</p>
                  <ul className="list-disc pl-5 text-muted-foreground">{res.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
                </div>
              )}
              {res.savings_tips.length > 0 && (
                <div className="rounded-lg bg-secondary/60 p-3 text-sm">
                  <p className="mb-1 flex items-center gap-2 font-medium"><PiggyBank className="h-4 w-4 text-primary" />Possible savings</p>
                  <ul className="list-disc pl-5 text-muted-foreground">{res.savings_tips.map((w, i) => <li key={i}>{w}</li>)}</ul>
                </div>
              )}
              <p className="text-xs text-muted-foreground">Figures are AI estimates and not verified supplier quotations. Confirm prices with vendors.</p>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
