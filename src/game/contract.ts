import type { CharacterId, CharacterPlacement, EndingId, EndingResult, LocationId } from "./types";

export const MOCK_LABEL = "โหมดทดสอบ — ยังไม่เชื่อม Botnoi Agent";
export type GameStatus = "awaiting_name" | "playing" | "finished";
export type GameResponse = {
  sessionId: string | null;
  status: GameStatus;
  mode: "mock";
  wolfName: string | null;
  questionNumber: number;
  totalQuestions: 10;
  questionId: string | null;
  sceneId: string | null;
  locationId: LocationId;
  characterIds: CharacterId[];
  characters: CharacterPlacement[];
  title: string;
  narrative: string[];
  question: string | null;
  choices: { choiceId: string; letter: string; label: string }[];
  ending: (EndingResult & { endingId: EndingId; rewardId: EndingId }) | null;
  history: { questionId: string; choiceId: string; label: string }[];
};

export class GameError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}