import { useSyncExternalStore } from "react";
import type { NoteSummary } from "./ai.functions";

export type EventStatus = "Planning" | "Confirmed" | "Completed" | "Cancelled";
export type EventItem = {
  id: string; name: string; type: string; date: string; time: string; location: string;
  attendees: number; budget: number; description: string; status: EventStatus; demo?: boolean;
};
export type TaskStatus = "pending" | "in-progress" | "completed";
export type Task = {
  id: string; eventId: string; title: string; description: string;
  priority: "High" | "Medium" | "Low"; deadline: string; status: TaskStatus; ai?: boolean; demo?: boolean;
};
export type Note = {
  id: string; eventId: string; title: string; raw: string; summary: NoteSummary | null; createdAt: string; demo?: boolean;
};
type State = { events: EventItem[]; tasks: Task[]; notes: Note[] };

export const uid = () => Math.random().toString(36).slice(2, 10);
const day = (offset: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
};

function demo(): State {
  const events: EventItem[] = [
    { id: "e1", name: "Q4 Leadership Workshop", type: "Workshop", date: day(21), time: "09:00", location: "Riverside Conference Centre", attendees: 50, budget: 60000, description: "Full-day strategy workshop for team leads.", status: "Planning", demo: true },
    { id: "e2", name: "Product Launch Meetup", type: "Conference", date: day(9), time: "18:00", location: "The Loft, Downtown", attendees: 120, budget: 95000, description: "Evening launch event with demos and networking.", status: "Confirmed", demo: true },
    { id: "e3", name: "Thandi's 30th Birthday", type: "Birthday", date: day(35), time: "19:00", location: "To be confirmed", attendees: 40, budget: 15000, description: "Garden party with dinner and music.", status: "Planning", demo: true },
    { id: "e4", name: "Monthly Team Meeting", type: "Meeting", date: day(4), time: "10:00", location: "Board Room 2", attendees: 15, budget: 1500, description: "Regular planning sync.", status: "Confirmed", demo: true },
  ];
  const t = (eventId: string, title: string, priority: Task["priority"], off: number, status: TaskStatus): Task => ({ id: uid(), eventId, title, description: "", priority, deadline: day(off), status, demo: true });
  const tasks: Task[] = [
    t("e1", "Book workshop venue", "High", 2, "in-progress"),
    t("e1", "Confirm catering for 50", "High", 7, "pending"),
    t("e1", "Send invitations", "Medium", 5, "pending"),
    t("e1", "Prepare facilitator slides", "Medium", 16, "pending"),
    t("e2", "Finalize guest list", "High", 1, "completed"),
    t("e2", "Arrange AV equipment", "High", 3, "in-progress"),
    t("e2", "Print name badges", "Low", 7, "pending"),
    t("e2", "Brief photographer", "Low", 6, "completed"),
    t("e3", "Choose theme and decor", "Medium", 14, "pending"),
    t("e4", "Share agenda", "Medium", 2, "completed"),
  ];
  const notes: Note[] = [];
  return { events, tasks, notes };
}

const KEY = "eventease:v1";
const initial = demo();
let state: State = initial;
let loaded = false;
const listeners = new Set<() => void>();

function get(): State {
  if (!loaded && typeof window !== "undefined") {
    loaded = true;
    try {
      const s = localStorage.getItem(KEY);
      if (s) state = JSON.parse(s);
    } catch {}
  }
  return state;
}
function sub(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}
export function useStore() {
  return useSyncExternalStore(sub, get, () => initial);
}
export function update(fn: (s: State) => State) {
  state = fn(get());
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {}
  listeners.forEach((l) => l());
}
export function resetDemo() {
  update(() => demo());
}
export function clearAll() {
  update(() => ({ events: [], tasks: [], notes: [] }));
}

export function validateEvent(e: Partial<EventItem>, today = new Date().toISOString().slice(0, 10)) {
  const errors: Record<string, string> = {};
  if (!e.name?.trim()) errors.name = "Event name is required.";
  if (!e.type?.trim()) errors.type = "Event type is required.";
  if (!e.date || isNaN(Date.parse(e.date))) errors.date = "A valid date is required.";
  else if (e.date < today && e.status !== "Completed") errors.date = "Date cannot be in the past.";
  if (!e.location?.trim()) errors.location = "Location is required (use 'TBC' if unknown).";
  if (e.attendees == null || e.attendees < 1) errors.attendees = "At least 1 attendee.";
  if (e.budget == null || e.budget < 0) errors.budget = "Budget cannot be negative.";
  return errors;
}

export const fmtDate = (d: string) =>
  new Date(d + "T00:00:00").toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
export const daysUntil = (d: string) =>
  Math.round((new Date(d + "T00:00:00").getTime() - new Date(new Date().toDateString()).getTime()) / 86400000);
export const money = (n: number) => "R " + Math.round(n).toLocaleString();
