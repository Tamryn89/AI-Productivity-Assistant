import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { resetDemo, clearAll } from "@/lib/store";
import { PageHeader, ResponsibleAINotice } from "@/components/AppShell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — EventEase AI" },
      { name: "description", content: "Manage your EventEase AI data and review responsible AI information." },
      { property: "og:title", content: "Settings — EventEase AI" },
      { property: "og:description", content: "Manage your EventEase AI data and review responsible AI information." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" subtitle="Manage your workspace data." />
      <ResponsibleAINotice />
      <div className="grid gap-4 md:grid-cols-2">
        <section className="card-soft p-5">
          <h2 className="font-semibold">Data storage</h2>
          <p className="mt-1 text-sm text-muted-foreground">Events, tasks and saved summaries are stored in this browser. They are not shared with other devices or users.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => { if (confirm("Replace your data with sample data?")) { resetDemo(); toast.success("Sample data restored"); } }}>Restore sample data</Button>
            <Button variant="destructive" onClick={() => { if (confirm("Delete all events, tasks and notes?")) { clearAll(); toast.success("All data cleared"); } }}>Clear all data</Button>
          </div>
        </section>
        <section className="card-soft p-5">
          <h2 className="font-semibold">Integrations</h2>
          <ul className="mt-2 grid gap-2 text-sm">
            <li className="flex justify-between"><span>AI features</span><span className="font-medium text-success">Connected</span></li>
            <li className="flex justify-between"><span>Email sending</span><span className="text-muted-foreground">Not configured — copy drafts instead</span></li>
            <li className="flex justify-between"><span>Venue booking & payments</span><span className="text-muted-foreground">Not configured</span></li>
          </ul>
        </section>
      </div>
    </>
  );
}
