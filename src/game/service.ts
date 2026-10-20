import type { GameProvider, GameSession } from "./types";
import { GameError, type GameResponse } from "./contract";

export type StoredSession = { session: GameSession; revision: number };
export interface SessionRepository {
  create(owner: string, session: GameSession): Promise<void>;
  read(owner: string, id: string): Promise<StoredSession | null>;
  replace(owner: string, id: string, revision: number, session: GameSession): Promise<boolean>;
  revoke(owner: string, id: string, revision: number): Promise<boolean>;
}

export function awaitingName(): GameResponse {
  return { sessionId: null, status: "awaiting_name", mode: "mock", wolfName: null, questionNumber: 0,
    totalQuestions: 10, questionId: null, sceneId: null, locationId: "apple-tree", characterIds: ["player"],
    characters: [{ id: "player", x: 50, height: 50 }], title: "หมาป่าหลงนิทาน", narrative: [], question: null,
    choices: [], ending: null, history: [] };
}

export class GameService {
  constructor(private repository: SessionRepository, private provider: GameProvider) {}

  private async require(owner: string, id: string) {
    const record = await this.repository.read(owner, id);
    if (!record) throw new GameError(404, "SESSION_NOT_FOUND", "ไม่พบรอบเกม หรือรอบนี้หมดอายุแล้ว");
    return record;
  }

  private async response(s: GameSession): Promise<GameResponse> {
    const scene = s.currentScene;
    const ending = s.finished ? await this.provider.getEnding(s) : null;
    return {
      sessionId: s.sessionId, status: s.finished ? "finished" : "playing", mode: "mock", wolfName: s.wolfName,
      questionNumber: s.finished ? 10 : s.step + 1, totalQuestions: 10,
      questionId: scene?.id ?? null, sceneId: scene?.id ?? `ending-${ending?.id}`,
      locationId: scene?.location ?? "apple-tree", characterIds: scene?.characters.map(c => c.id) ?? ["player"],
      characters: scene?.characters ?? [{ id: "player", x: 50, height: 50 }],
      title: scene?.title ?? ending?.title ?? "หมาป่าหลงนิทาน",
      narrative: scene?.paragraphs ?? (ending ? [ending.summary] : []), question: scene?.question ?? null,
      choices: scene?.choices.map((c, i) => ({ choiceId: c.id, letter: ["A", "B", "C"][i] ?? "", label: c.label })) ?? [],
      ending: ending ? { ...ending, endingId: ending.id, rewardId: ending.id } : null,
      history: s.history.map(h => ({ questionId: h.sceneId, choiceId: h.choiceId, label: h.label })),
    };
  }

  async start(owner: string, name: string) {
    const s = await this.provider.startGame(name);
    await this.repository.create(owner, s);
    return this.response(s);
  }

  async state(owner: string, id: string) { return this.response((await this.require(owner, id)).session); }

  async answer(owner: string, id: string, questionId: string, choiceId: string) {
    const { session, revision } = await this.require(owner, id);
    if (session.finished || session.currentScene?.id !== questionId)
      throw new GameError(409, "STALE_QUESTION", "ข้อนี้ตอบไปแล้ว กรุณาอ่านสถานะล่าสุด");
    if (!session.currentScene.choices.some(c => c.id === choiceId))
      throw new GameError(400, "INVALID_CHOICE", "ตัวเลือกไม่ตรงกับข้อปัจจุบัน");
    const next = await this.provider.submitChoice(session, choiceId);
    if (!await this.repository.replace(owner, id, revision, next))
      throw new GameError(409, "DUPLICATE_ANSWER", "มีคำตอบสำหรับข้อนี้แล้ว กรุณาอ่านสถานะล่าสุด");
    return this.response(next);
  }

  async restart(owner: string, id: string) {
    const { session, revision } = await this.require(owner, id);
    if (!await this.repository.revoke(owner, id, revision))
      throw new GameError(409, "STALE_SESSION", "รอบนี้ถูกเปลี่ยนแล้ว กรุณาเริ่มใหม่");
    return this.start(owner, session.wolfName);
  }
}