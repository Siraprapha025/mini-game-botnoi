import { describe, expect, it } from "vitest";
import { answer, evaluateEnding, newSession, REWARDS, buildEnding } from "./engine";
import { TOTAL_QUESTIONS } from "./story";
import type { GameSession } from "./types";

const play = (ids: string[]) => ids.reduce<GameSession>((s, id) => answer(s, id), newSession("เทา", "t"));

const PATHS = {
  E1: ["s1-greet", "s2-warn", "s3-fake", "s4-tell", "s5-throw", "s6-escape", "s7-glasses", "s8-cough", "s9-point", "s10-tell"],
  E2: ["s1-follow", "s2-warn", "s3-fake", "s4-tell", "s5-throw", "s6-escape", "s7-glasses", "s8-cough", "s9-point", "s10-quiet"],
  E3: ["s1-eat", "s2-meadow", "s3-no", "s4-hide", "s5-bush", "s6-leave", "s7-cat", "s8-answer", "s9-freeze", "s10-nap"],
  E4: ["s1-eat", "s2-ask", "s3-join", "s4-cover", "s5-lookout", "s6-lure", "s7-blanket", "s8-answer", "s9-grab", "s10-share"],
  E5: ["s1-eat", "s2-meadow", "s3-no", "s4-shrug", "s5-throw", "s6-leave", "s7-glasses", "s8-window", "s9-run", "s10-nap"],
} as const;

describe("wolf tale engine", () => {
  it("asks exactly 10 questions before finishing", () => {
    let s = newSession("เทา", "t");
    for (let i = 0; i < TOTAL_QUESTIONS; i++) {
      expect(s.finished).toBe(false);
      expect(s.currentScene?.choices).toHaveLength(3);
      s = answer(s, s.currentScene!.choices[0]!.id);
    }
    expect(s.finished).toBe(true);
    expect(s.history).toHaveLength(10);
  });

  for (const [ending, path] of Object.entries(PATHS)) {
    it(`reaches ${ending} with its fixed reward`, () => {
      const s = play([...path]);
      expect(s.history.map((h) => h.choiceId)).toEqual(path); // every id was valid at that step
      expect(evaluateEnding(s.state)).toBe(ending);
      expect(buildEnding(s).reward).toEqual(REWARDS[ending as keyof typeof REWARDS]);
    });
  }

  it("ignores a repeated or stale choice id (double tap does not skip)", () => {
    const s1 = answer(newSession("เทา", "t"), "s1-eat");
    const s2 = answer(s1, "s1-eat");
    expect(s2.step).toBe(1);
  });

  it("rewards match endings", () => {
    expect(REWARDS.E1.name).toBe("แอปเปิ้ลหัวใจสิงห์");
    expect(REWARDS.E2.name).toBe("แอปเปิ้ลเงาจันทร์");
    expect(REWARDS.E3.name).toBe("แอปเปิ้ลพลิกชะตา");
    expect(REWARDS.E4.name).toBe("แอปเปิ้ลเขี้ยวกล");
    expect(REWARDS.E5.name).toBe("แอปเปิ้ลสุขสงบ");
  });

  it("same letter every time does not force one ending", () => {
    const byLetter = [0, 1, 2].map((k) => {
      let s = newSession("เทา", "t");
      while (!s.finished) s = answer(s, s.currentScene!.choices[k]!.id);
      return evaluateEnding(s.state);
    });
    expect(new Set(byLetter).size).toBeGreaterThan(1);
  });
});
