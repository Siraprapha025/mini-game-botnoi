import { z } from "zod";
import { DATA_VERSION } from "./engine";
import { TOTAL_QUESTIONS } from "./story";
import type { GameSession } from "./types";

const KEY = "wolf-tale-session";

const effects = z.object({}).passthrough();
const choice = z.object({ id: z.string(), label: z.string(), effects, memory: z.string().optional() });
const scene = z.object({
  id: z.string(), index: z.number().int(), location: z.string(),
  characters: z.array(z.object({ id: z.string(), x: z.number(), height: z.number() }).passthrough()),
  title: z.string(), paragraphs: z.array(z.string()), question: z.string(), choices: z.array(choice).length(3),
});
const schema = z.object({
  version: z.literal(DATA_VERSION),
  sessionId: z.string().min(1),
  wolfName: z.string().min(1).max(100),
  step: z.number().int().min(0).max(TOTAL_QUESTIONS),
  history: z.array(z.object({ sceneId: z.string(), choiceId: z.string(), label: z.string(), memory: z.string().optional() })),
  state: z.object({
    trust: z.number(), suspicion: z.number(), help: z.number(), villainAlly: z.number(), withdraw: z.number(),
    witnesses: z.array(z.string()), safe: z.array(z.string()), flags: z.array(z.string()),
  }),
  currentScene: scene.nullable(),
  finished: z.boolean(),
});

export type LoadResult = { session: GameSession | null; recovered: boolean };

export function loadSession(): LoadResult {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { session: null, recovered: false };
    const parsed = schema.safeParse(JSON.parse(raw));
    if (!parsed.success || parsed.data.history.length !== parsed.data.step) {
      localStorage.removeItem(KEY);
      return { session: null, recovered: true };
    }
    return { session: parsed.data as unknown as GameSession, recovered: false };
  } catch {
    try { localStorage.removeItem(KEY); } catch { /* ignore */ }
    return { session: null, recovered: true };
  }
}

export function saveSession(s: GameSession) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* storage full or blocked */ }
}

export function clearSession() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}
