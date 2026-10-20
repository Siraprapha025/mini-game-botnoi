// Pure game rules: state updates and ending evaluation. No UI, no storage.
import { buildScene, TOTAL_QUESTIONS } from "./story";
import type { AnswerRecord, AppleReward, ChoiceEffects, EndingId, EndingResult, GameSession, GameState } from "./types";

export const DATA_VERSION = 1;

export const initialState = (): GameState => ({
  trust: 0, suspicion: 0, help: 0, villainAlly: 0, withdraw: 0, witnesses: [], safe: [], flags: [],
});

const uniq = <T,>(a: T[]) => Array.from(new Set(a));
const nn = (n: number) => Math.max(0, n);

export function applyEffects(s: GameState, e: ChoiceEffects): GameState {
  return {
    trust: nn(s.trust + (e.trust ?? 0)),
    suspicion: nn(s.suspicion + (e.suspicion ?? 0)),
    help: nn(s.help + (e.help ?? 0)),
    villainAlly: nn(s.villainAlly + (e.villainAlly ?? 0)),
    withdraw: nn(s.withdraw + (e.withdraw ?? 0)),
    witnesses: uniq([...s.witnesses, ...(e.witnesses ?? [])]),
    safe: uniq([...s.safe, ...(e.safe ?? [])]),
    flags: uniq([...s.flags, ...(e.flags ?? [])]),
  };
}

export function newSession(wolfName: string, sessionId: string): GameSession {
  const state = initialState();
  return {
    version: DATA_VERSION, sessionId, wolfName, step: 0, history: [], state,
    currentScene: buildScene(0, state, wolfName, []), finished: false,
  };
}

/** Applies one answer. Ignores answers that don't belong to the current scene (double clicks, stale UI). */
export function answer(session: GameSession, choiceId: string): GameSession {
  const scene = session.currentScene;
  if (session.finished || !scene) return session;
  const choice = scene.choices.find((c) => c.id === choiceId);
  if (!choice) return session;
  const state = applyEffects(session.state, choice.effects);
  const history: AnswerRecord[] = [...session.history, { sceneId: scene.id, choiceId, label: choice.label, memory: choice.memory }];
  const step = session.step + 1;
  const finished = step >= TOTAL_QUESTIONS;
  return {
    ...session, state, history, step, finished,
    currentScene: finished ? null : buildScene(step, state, session.wolfName, history),
  };
}

/**
 * Ending rules, checked in this order so exactly one result applies:
 * 1. E4 — grabbed the basket with the villain and kept it (shared the snack).
 * 2. E3 — suspicion >= 3 and the villain was never pointed out (villain got away).
 * 3. E1 — Red and Grandma both safe, someone witnessed the help, player didn't stay quiet.
 * 4. E2 — Red and Grandma both safe, but nobody knows (no witnesses, or chose to stay quiet).
 * 5. E3 — any remaining suspicion while the villain escaped.
 * 6. E5 — otherwise the wolf stepped away and returned to a calm life.
 */
export function evaluateEnding(s: GameState): EndingId {
  const has = (f: string) => s.flags.includes(f);
  const caught = has("pointedVillain");
  const bothSafe = s.safe.includes("red") && s.safe.includes("grandma");
  if (has("basketGrab") && has("sharedSnack")) return "E4";
  if (s.suspicion >= 3 && !caught) return "E3";
  if (bothSafe && s.witnesses.length > 0 && !has("quiet")) return "E1";
  if (bothSafe) return "E2";
  if (s.suspicion >= 1 && !caught) return "E3";
  return "E5";
}

export const REWARDS: Record<EndingId, AppleReward> = {
  E1: { name: "แอปเปิ้ลหัวใจสิงห์", color: "สีแดงประกายทอง", pattern: "ลายหัวใจทอง", power: "แบ่งให้ใครกิน คนนั้นจะกล้าขึ้นชั่วคราว", powerShort: "แบ่งให้ใครกิน คนนั้นกล้าขึ้นชั่วคราว" },
  E2: { name: "แอปเปิ้ลเงาจันทร์", color: "สีเงินอมม่วง", pattern: "ลายจันทร์เสี้ยว", power: "ซ่อนตัวได้ชั่วครู่ แต่ซ่อนเสียงเคี้ยวไม่ได้", powerShort: "ซ่อนตัวได้ชั่วครู่ (ยกเว้นเสียงเคี้ยว)" },
  E3: { name: "แอปเปิ้ลพลิกชะตา", color: "สีทองอำพัน", pattern: "ลายเกลียว", power: "ให้ผู้ใช้กับอีกคนเห็นเหตุการณ์จากมุมของกันและกันชั่วครู่", powerShort: "สลับมุมมองกับอีกคนได้ชั่วครู่" },
  E4: { name: "แอปเปิ้ลเขี้ยวกล", color: "สีม่วงเข้มประกายแดง", pattern: "ลายเขี้ยวคู่", power: "สร้างกลิ่นขนมลวงใจ แต่ถ้าหิวอาจหลอกตัวเองได้", powerShort: "สร้างกลิ่นขนมลวงใจ (ระวังหลอกตัวเอง)" },
  E5: { name: "แอปเปิ้ลสุขสงบ", color: "สีเขียวหยก", pattern: "ลายใบไม้", power: "สร้างมุมพักเงียบ ๆ พร้อมชาร้อนหนึ่งถ้วย", powerShort: "เสกมุมพักเงียบพร้อมชาร้อนหนึ่งถ้วย" },
};

const ENDING_TEXT: Record<EndingId, { title: string; summary: string; fortune: string; short: string; tags: string[] }> = {
  E1: {
    title: "หมาป่าผู้ช่วยนิทาน",
    summary: "หนูน้อยหมวกแดงและคุณยายปลอดภัย และทุกคนรู้ว่าหมาป่าสีเทาตัวหนึ่งคือคนที่ช่วยไว้ นิทานเรื่องนี้เลยมีหมาป่าที่ดีเพิ่มมาอีกตัว",
    fortune: "เป็นสายกล้าลงมือ ปากบอกว่าไม่เกี่ยว แต่ตัวไปช่วยแล้วทุกที",
    short: "ปากบอกไม่เกี่ยว แต่ตัวไปช่วยแล้ว",
    tags: ["help", "trust"],
  },
  E2: {
    title: "ฮีโร่ที่ไม่มีใครรู้",
    summary: "ทุกคนปลอดภัยดี แต่ไม่มีใครรู้เลยว่าเบื้องหลังมีหมาป่าสีเทาคอยวางแผนอยู่เงียบ ๆ และคุณก็ชอบให้เป็นแบบนั้น",
    fortune: "ชอบช่วยแบบเงียบ ๆ วางแผนเก่ง และแอบหลบเวลามีคนจะชม",
    short: "ช่วยเงียบ ๆ วางแผนเก่ง หลบสปอตไลต์",
    tags: ["help"],
  },
  E3: {
    title: "ผู้ต้องสงสัยผิดตัว",
    summary: "หมาป่าตัวร้ายแอบหนีไปได้ ส่วนทุกสายตากลับหันมาที่หมาป่าสีเทา เรื่องนี้ยังไม่จบหรอก แค่ต้องรอจังหวะเล่าอีกมุมหนึ่ง",
    fortune: "มองเห็นมุมที่คนอื่นมองข้าม และมักได้โอกาสพลิกสถานการณ์เมื่อถึงเวลา",
    short: "เห็นมุมที่คนอื่นมองข้าม พร้อมพลิกสถานการณ์",
    tags: ["suspicion"],
  },
  E4: {
    title: "หุ้นส่วนเขี้ยวแสบ",
    summary: "แผนพายเบอร์รี่สำเร็จ! คุณกับหมาป่าตัวร้ายนั่งแบ่งขนมกันใต้แสงแดด นิทานเรื่องนี้เลยมีตอนพิเศษที่ไม่มีใครเขียนไว้",
    fortune: "หัวไว ขี้เล่น และชอบลองแผนแสบ ๆ ให้ชีวิตมีสีสัน",
    short: "หัวไว ขี้เล่น ชอบลองแผนแสบ",
    tags: ["ally"],
  },
  E5: {
    title: "ขอแค่กินแอปเปิ้ล",
    summary: "คุณถอยออกมาจากเรื่องวุ่นได้อย่างนุ่มนวล กลับไปนั่งใต้ต้นแอปเปิ้ลต้นเดิม ฟังเสียงใบไม้ และกินแอปเปิ้ลอย่างสบายใจ",
    fortune: "รู้ว่าเมื่อไหร่ควรพัก และรักษาพื้นที่สงบของตัวเองได้เก่ง",
    short: "รู้จังหวะพัก รักษาพื้นที่สงบของตัวเอง",
    tags: ["withdraw"],
  },
};

function tagOf(id: string, s: GameState): string {
  void s;
  if (/(follow|warn|fake|tell|throw|escape|glasses|cough|call|point|return)/.test(id)) return "help";
  if (/(join|cover|lookout|lure|blanket|answer|grab|share|ask)/.test(id)) return "ally";
  if (/(hide|peek|freeze|bush)/.test(id)) return "suspicion";
  if (/greet/.test(id)) return "trust";
  return "withdraw";
}

export function buildEnding(session: GameSession): EndingResult {
  const id = evaluateEnding(session.state);
  const t = ENDING_TEXT[id];
  const picked = session.history.filter((h) => h.memory && t.tags.includes(tagOf(h.choiceId, session.state)));
  const moments = (picked.length ? picked : session.history.filter((h) => h.memory)).slice(-2).map((h) => h.memory!);
  const momentText = moments.length ? `ตอนที่${moments.join(" และตอนที่")} ` : "";
  return {
    id,
    title: t.title,
    summary: t.summary,
    reward: REWARDS[id],
    fortune: `หมาป่าของคุณในรอบนี้… ${momentText}บอกว่าคุณ${t.fortune}`,
    fortuneShort: `หมาป่าของคุณในรอบนี้… ${t.short}`,
  };
}
