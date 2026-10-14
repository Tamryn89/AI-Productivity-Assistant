import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import ReactMarkdown from "react-markdown";
import { ArrowUp, Bot, Loader2, RotateCcw } from "lucide-react";
import { chatAssistant } from "@/lib/ai.functions";
import { useStore, fmtDate, money } from "@/lib/store";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/assistant")({
  head: () => ({
    meta: [
      { title: "AI Event Assistant — EventEase AI" },
      { name: "description", content: "Chat with an AI planning assistant about themes, timelines, guests and budgets." },
      { property: "og:title", content: "AI Event Assistant — EventEase AI" },
      { property: "og:description", content: "Chat with an AI planning assistant about themes, timelines, guests and budgets." },
    ],
  }),
  component: AssistantPage,
});

type Msg = { role: "user" | "assistant"; content: string };
const STARTERS = ["Suggest a theme and activities for a 50-person company workshop", "How far in advance should I send invitations?", "Review my upcoming events and flag any risks", "Ideas to cut catering costs without looking cheap"];

function AssistantPage() {
  const { events } = useStore();
  const chat = useServerFn(chatAssistant);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => end.current?.scrollIntoView({ behavior: "smooth" }), [msgs, loading]);

  const send = async (text: string) => {
    const t = text.trim();
    if (!t || loading) return;
    const next: Msg[] = [...msgs, { role: "user", content: t }];
    setMsgs(next); setInput(""); setErr(""); setLoading(true);
    const context = events.map((e) => `- ${e.name} (${e.type}), ${fmtDate(e.date)}, ${e.location}, ${e.attendees} guests, budget ${money(e.budget)}, ${e.status}`).join("\n");
    try {
      const { reply } = await chat({ data: { messages: next, context } });
      setMsgs([...next, { role: "assistant", content: reply }]);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader title="AI Event Assistant" subtitle="Ask anything about planning. Answers are suggestions — not confirmed facts."
        action={msgs.length > 0 ? <Button variant="outline" onClick={() => setMsgs([])}><RotateCcw className="mr-1 h-4 w-4" />New chat</Button> : undefined} />
      <section className="card-soft flex h-[calc(100vh-14rem)] min-h-[28rem] flex-col">
        <div className="flex-1 overflow-y-auto p-5">
          {msgs.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-5 text-center">
              <span className="bg-brand flex h-14 w-14 items-center justify-center rounded-2xl text-primary-foreground"><Bot className="h-7 w-7" /></span>
              <div><p className="font-semibold">Hi! I'm your planning assistant.</p><p className="text-sm text-muted-foreground">I know about your events. Try one of these:</p></div>
              <div className="grid w-full max-w-xl gap-2 sm:grid-cols-2">
                {STARTERS.map((s) => <button key={s} onClick={() => send(s)} className="rounded-lg border p-3 text-left text-sm transition-colors hover:border-primary/40 hover:bg-accent">{s}</button>)}
              </div>
            </div>
          ) : (
            <div className="mx-auto grid max-w-3xl gap-5">
              {msgs.map((m, i) =>
                m.role === "user" ? (
                  <div key={i} className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground">{m.content}</div>
                ) : (
                  <div key={i} className="flex gap-3">
                    <span className="bg-brand flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-primary-foreground"><Bot className="h-4 w-4" /></span>
                    <div className="prose-chat min-w-0 text-sm leading-relaxed"><ReactMarkdown>{m.content}</ReactMarkdown></div>
                  </div>
                ),
              )}
              {loading && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Thinking…</div>}
              {err && <p className="text-sm text-destructive">{err}</p>}
              <div ref={end} />
            </div>
          )}
        </div>
        <form className="border-t p-3" onSubmit={(e) => { e.preventDefault(); send(input); }}>
          <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-xl border bg-card p-2 focus-within:ring-2 focus-within:ring-ring">
            <Textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
              placeholder="Ask about themes, schedules, budgets…" className="max-h-40 min-h-10 resize-none border-0 shadow-none focus-visible:ring-0" rows={1} />
            <Button type="submit" size="icon" disabled={loading || !input.trim()} aria-label="Send"><ArrowUp className="h-4 w-4" /></Button>
          </div>
        </form>
      </section>
    </>
  );
}
