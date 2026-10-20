export type CharacterId = "player" | "red" | "villain" | "grandma" | "huntsman";
export type LocationId = "apple-tree" | "crossroads" | "deep-forest" | "grandma-house" | "grandma-room";
export type EndingId = "E1" | "E2" | "E3" | "E4" | "E5";
export type Witness = "red" | "grandma" | "huntsman";

export type ChoiceEffects = {
  trust?: number;
  suspicion?: number;
  help?: number;
  villainAlly?: number;
  withdraw?: number;
  witnesses?: Witness[];
  safe?: ("red" | "grandma")[];
  flags?: string[];
};

export type Choice = {
  id: string;
  label: string;
  effects: ChoiceEffects;
  /** Short phrase used in the fortune text, e.g. "พาคุณยายหนีทางหลังบ้าน" */
  memory?: string;
};

export type CharacterPlacement = { id: CharacterId; x: number; height: number; flip?: boolean; disguised?: boolean };

export type Scene = {
  id: string;
  index: number; // 0-based
  location: LocationId;
  characters: CharacterPlacement[];
  title: string;
  paragraphs: string[];
  question: string;
  choices: Choice[];
};

export type GameState = {
  trust: number;
  suspicion: number;
  help: number;
  villainAlly: number;
  withdraw: number;
  witnesses: Witness[];
  safe: ("red" | "grandma")[];
  flags: string[];
};

export type AnswerRecord = { sceneId: string; choiceId: string; label: string; memory?: string | undefined };

export type GameSession = {
  version: number;
  sessionId: string;
  wolfName: string;
  step: number; // number of answered questions
  history: AnswerRecord[];
  state: GameState;
  currentScene: Scene | null;
  finished: boolean;
};

export type AppleReward = { name: string; color: string; pattern: string; power: string; powerShort: string };

export type EndingResult = {
  id: EndingId;
  title: string;
  summary: string;
  reward: AppleReward;
  fortune: string;
  fortuneShort: string;
};

export interface GameProvider {
  startGame(wolfName: string): Promise<GameSession>;
  submitChoice(session: GameSession, choiceId: string): Promise<GameSession>;
  getEnding(session: GameSession): Promise<EndingResult>;
}
