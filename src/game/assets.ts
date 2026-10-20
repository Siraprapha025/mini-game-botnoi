// Single asset manifest: change a file here and every scene/card picks it up.
import bgAppleTree from "@/assets/game/bg-apple-tree.jpg";
import bgCrossroads from "@/assets/game/bg-crossroads.jpg";
import bgDeepForest from "@/assets/game/bg-deep-forest.jpg";
import bgGrandmaHouse from "@/assets/game/bg-grandma-house.jpg";
import bgGrandmaRoom from "@/assets/game/bg-grandma-room.jpg";
import player from "@/assets/game/player-wolf.gif";
import red from "@/assets/game/little-red-riding-hood.gif";
import villain from "@/assets/game/villain-wolf.gif";
import grandma from "@/assets/game/grandmother.gif";
import huntsman from "@/assets/game/huntsman.gif";
import e1 from "@/assets/game/apple-e1.png";
import e2 from "@/assets/game/apple-e2.png";
import e3 from "@/assets/game/apple-e3.png";
import e4 from "@/assets/game/apple-e4.png";
import e5 from "@/assets/game/apple-e5.png";
import type { CharacterId, EndingId, LocationId } from "./types";

export const BACKGROUNDS: Record<LocationId, { src: string | null; label: string }> = {
  "apple-tree": { src: bgAppleTree, label: "ป่าใต้ต้นแอปเปิ้ล" },
  crossroads: { src: bgCrossroads, label: "ทางแยกในป่า" },
  "deep-forest": { src: bgDeepForest, label: "ทางเดินป่าทึบ" },
  "grandma-house": { src: bgGrandmaHouse, label: "หน้าบ้านคุณยาย" },
  "grandma-room": { src: bgGrandmaRoom, label: "ห้องในบ้านคุณยาย" },
};

export const CHARACTERS: Record<CharacterId, { src: string | null; label: string }> = {
  player: { src: player, label: "หมาป่าสีเทา (คุณ)" },
  red: { src: red, label: "หนูน้อยหมวกแดง" },
  villain: { src: villain, label: "หมาป่าตัวร้าย" },
  grandma: { src: grandma, label: "คุณยาย" },
  huntsman: { src: huntsman, label: "นายพราน" },
};

export const APPLES: Record<EndingId, string | null> = { E1: e1, E2: e2, E3: e3, E4: e4, E5: e5 };

const preloaded = new Set<string>();
export function preload(src: string | null | undefined) {
  if (!src || typeof window === "undefined" || preloaded.has(src)) return;
  preloaded.add(src);
  const img = new Image();
  img.src = src;
}
