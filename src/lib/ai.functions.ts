import { createServerFn } from "@tanstack/react-start";
import type { ChatTurn } from "./ai.server";

const str = { type: "string" };
const strArr = { type: "array", items: str };
const obj = (properties: Record<string, unknown>) => ({
  type: "object",
  properties,
  required: Object.keys(properties),
  additionalProperties: false,
});

export type InvitationInput = {
  name: string; type: string; datetime: string; location: string;
  audience: string; tone: string; details: string;
};
export const generateInvitation = createServerFn({ method: "POST" })
  .inputValidator((d: InvitationInput) => d)
  .handler(async ({ data }) => {
    const { runAI } = await import("./ai.server");
    const text = await runAI({
      instructions: `You are a professional event communication assistant. Generate a polished invitation email.
Requirements: include a subject line, greeting, event details, call to action and closing. Match the selected tone.
Do NOT invent missing dates, venues, registration links or other event information; use [PLACEHOLDER] brackets for missing essential details.
Keep it clear and easy to edit. Return subject and body separately.`,
      input: `Event name: ${data.name || "Not provided"}
Event type: ${data.type || "Not provided"}
Date and time: ${data.datetime || "Not provided"}
Location: ${data.location || "Not provided"}
Target audience: ${data.audience || "Not provided"}
Tone: ${data.tone}
Additional information: ${data.details || "None"}`,
      schema: { name: "invitation", schema: obj({ subject: str, body: str }) },
    });
    return JSON.parse(text) as { subject: string; body: string };
  });

export type PlanInput = {
  type: string; name: string; date: string; budget: number; attendees: number; resources: string;
};
export type PlannedTask = {
  title: string; description: string; priority: "High" | "Medium" | "Low";
  deadline: string; dependencies: string; estimated_cost: number | null; completion_criteria: string;
};
export const generatePlan = createServerFn({ method: "POST" })
  .inputValidator((d: PlanInput) => d)
  .handler(async ({ data }) => {
    const { runAI } = await import("./ai.server");
    const today = new Date().toISOString().slice(0, 10);
    const text = await runAI({
      instructions: `You are an experienced event project manager. Create an actionable preparation plan (8-12 tasks).
Each task: name, description, priority (High/Medium/Low), suggested deadline (YYYY-MM-DD, between the current date and the event date), dependencies, estimated cost in the user's currency where relevant (else null), completion criteria.
Schedule realistically before the event date. In "warnings", flag missing information, unrealistic deadlines and tasks requiring human confirmation.
Never claim bookings have been made or tasks completed.`,
      input: `Event: ${data.name}
Event type: ${data.type}
Event date: ${data.date}
Current date: ${today}
Budget: ${data.budget}
Number of attendees: ${data.attendees}
Available resources: ${data.resources || "Not specified"}`,
      schema: {
        name: "plan",
        schema: obj({
          tasks: {
            type: "array",
            items: obj({
              title: str, description: str,
              priority: { type: "string", enum: ["High", "Medium", "Low"] },
              deadline: str, dependencies: str,
              estimated_cost: { type: ["number", "null"] },
              completion_criteria: str,
            }),
          },
          warnings: strArr,
        }),
      },
    });
    return JSON.parse(text) as { tasks: PlannedTask[]; warnings: string[] };
  });

export type NoteSummary = {
  executive_summary: string;
  decisions: string[];
  action_items: { task: string; owner: string; deadline: string }[];
  unresolved_questions: string[];
  risks: string[];
  recommendations: string[];
};
export const summarizeNotes = createServerFn({ method: "POST" })
  .inputValidator((d: { notes: string }) => {
    if (!d.notes || d.notes.trim().length < 20) throw new Error("Please paste at least a few lines of notes.");
    return { notes: d.notes.slice(0, 20000) };
  })
  .handler(async ({ data }) => {
    const { runAI } = await import("./ai.server");
    const text = await runAI({
      instructions: `You are an event coordination assistant. Analyze the meeting notes.
Output: executive summary, key decisions, action items (owner and deadline ONLY when explicitly stated, else "Not specified"), unresolved questions, potential risks, and follow-up recommendations.
Do not invent decisions, names, owners or deadlines. "risks" and "recommendations" are YOUR suggestions; everything else must be extracted from the notes. Preserve important event details.`,
      input: `Meeting notes:\n${data.notes}`,
      schema: {
        name: "summary",
        schema: obj({
          executive_summary: str,
          decisions: strArr,
          action_items: { type: "array", items: obj({ task: str, owner: str, deadline: str }) },
          unresolved_questions: strArr,
          risks: strArr,
          recommendations: strArr,
        }),
      },
    });
    return JSON.parse(text) as NoteSummary;
  });

export type BudgetResult = {
  allocations: { category: string; amount: number; rationale: string }[];
  savings_tips: string[];
  warnings: string[];
};
export const planBudget = createServerFn({ method: "POST" })
  .inputValidator((d: { total: number; currency: string; eventType: string; attendees: number; requirements: string }) => {
    if (!(d.total > 0)) throw new Error("Enter a total budget greater than zero.");
    return d;
  })
  .handler(async ({ data }) => {
    const { runAI } = await import("./ai.server");
    const text = await runAI({
      instructions: `You are an event budget assistant. Suggest a spending plan across: Venue, Catering, Decorations, Equipment, Marketing, Contingency (add others only if requirements need them).
Amounts are ESTIMATES in the user's currency, never verified supplier quotes. Allocations should fit within the total budget. Flag overspending risks in "warnings" and give practical "savings_tips".`,
      input: `Total budget: ${data.total} ${data.currency}
Event type: ${data.eventType}
Attendees: ${data.attendees}
Requirements: ${data.requirements || "Not specified"}`,
      schema: {
        name: "budget",
        schema: obj({
          allocations: { type: "array", items: obj({ category: str, amount: { type: "number" }, rationale: str }) },
          savings_tips: strArr,
          warnings: strArr,
        }),
      },
    });
    return JSON.parse(text) as BudgetResult;
  });

export const chatAssistant = createServerFn({ method: "POST" })
  .inputValidator((d: { messages: ChatTurn[]; context: string }) => ({
    messages: d.messages.slice(-30),
    context: (d.context || "").slice(0, 4000),
  }))
  .handler(async ({ data }) => {
    const { runAI } = await import("./ai.server");
    const reply = await runAI({
      instructions: `You are the EventEase AI planning assistant. Help with event themes, activities, timelines, guest management and budgeting.
Be concise and practical; use markdown lists where helpful. When giving a recommendation, label it as a suggestion; never present estimates or assumptions as confirmed facts. You cannot book venues, send emails or make payments.
User's events (for context):\n${data.context}`,
      input: data.messages,
    });
    return { reply };
  });
