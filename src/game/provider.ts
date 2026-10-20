// GameProvider is the only thing the UI talks to. MockGameProvider runs locally.
// To use an AI agent later: implement GameProvider with server functions (secrets stay server-side)
// and swap `gameProvider` below — the UI does not change.
import { answer, buildEnding, newSession } from "./engine";
import type { GameProvider, GameSession } from "./types";

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export class MockGameProvider implements GameProvider {
  async startGame(wolfName: string) {
    return newSession(wolfName, uid());
  }
  async submitChoice(session: GameSession, choiceId: string) {
    return answer(session, choiceId);
  }
  async getEnding(session: GameSession) {
    if (!session.finished) throw new Error("ยังเล่นไม่ครบ");
    return buildEnding(session);
  }
}

export const gameProvider: GameProvider = new MockGameProvider();

export { cleanWolfName } from './validation';
