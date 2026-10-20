// Single place where the game talks to AI. Swap to Botnoi Agent here later.
import { createServerFn } from "@tanstack/react-start";
import { generateImage, generateResponse, GatewayError } from "@lovable.dev/ai-gateway";
import { z } from "zod";

export type Question = { scenario: string; options: [string, string, string]; imagePrompt: string };
export type GameResult = { title: string; description: string; imagePrompt: string };

function friendly(e: unknown): Error {
  console.error(e);
  if (e instanceof GatewayError) {
    if (e.httpStatus === 429) return new Error("มีคนเล่นเยอะมาก ลองใหม่อีกครั้งในอีกสักครู่นะ");
    if (e.httpStatus === 402) return new Error("เครดิต AI หมดแล้ว");
  }
  return new Error("AI ตอบกลับไม่ได้ ลองใหม่อีกครั้งนะ");
}

async function askJson(instructions: string, input: string, schema: Record<string, unknown>) {
  const res = await generateResponse({
    model: "openai/gpt-6-astra",
    instructions,
    input,
    text: { format: { type: "json_schema", name: "out", strict: true, schema } },
  });
  let text = "";
  for (const item of (res as { output?: unknown[] }).output ?? []) {
    const content = (item as { content?: { type: string; text?: string }[] }).content ?? [];
    for (const c of content) if (c.type === "output_text" && c.text) text += c.text;
  }
  return JSON.parse(text);
}

export const createQuestions = createServerFn({ method: "POST" }).handler(async () => {
  try {
    const data = await askJson(
      "คุณคือผู้สร้างมินิเกมทายบุคลิกภาพสุดน่ารักภาษาไทย สร้างสถานการณ์สมมติให้ผู้เล่นสวมบทบาทเป็นสัตว์หรือสิ่งของแปลกๆ เช่น 'คุณคือหมาป่า คุณจะทำอะไร?' แต่ละข้อมีตัวเลือก 3 ข้อสั้นๆ สนุก ไม่ซ้ำกัน และ imagePrompt เป็นภาษาอังกฤษบรรยายภาพตัวละครในสถานการณ์",
      `สร้าง 10 คำถาม ธีมสุ่ม: ${Math.random().toString(36).slice(2, 7)}`,
      {
        type: "object",
        additionalProperties: false,
        required: ["questions"],
        properties: {
          questions: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["scenario", "options", "imagePrompt"],
              properties: {
                scenario: { type: "string" },
                options: { type: "array", items: { type: "string" } },
                imagePrompt: { type: "string" },
              },
            },
          },
        },
      },
    );
    return (data.questions as Question[]).slice(0, 10).map((q) => ({
      ...q,
      options: q.options.slice(0, 3) as Question["options"],
    }));
  } catch (e) {
    throw friendly(e);
  }
});

export const createImage = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ prompt: z.string().min(1).max(1000) }).parse(d))
  .handler(async ({ data }) => {
    try {
      const res = await generateImage({
        model: "openai/gpt-image-2.5-sunburst",
        prompt: `Cute hand-drawn doodle illustration, thick black ink lines on cream paper, minimal warm orange accents, playful sketchbook style. ${data.prompt}`,
        size: "1024x1024",
        quality: "low",
        output_format: "jpeg",
      });
      const img = res.data?.[0];
      if (img?.b64_json) return `data:image/jpeg;base64,${img.b64_json}`;
      return img?.url ?? null;
    } catch (e) {
      console.error(e);
      return null;
    }
  });

export const createResult = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({ answers: z.array(z.object({ scenario: z.string(), choice: z.string() })).max(10) }).parse(d),
  )
  .handler(async ({ data }) => {
    try {
      return (await askJson(
        "คุณคือหมอดูบุคลิกภาพแสนน่ารัก วิเคราะห์คำตอบของผู้เล่นแล้วบอกว่าเขาคือ 'อะไร' (เช่น แอปเปิ้ลขี้เล่น) ให้ title สั้น, description ภาษาไทย 3-4 ประโยค อบอุ่นและขำๆ, imagePrompt ภาษาอังกฤษบรรยายภาพของผลลัพธ์นั้น",
        data.answers.map((a, i) => `${i + 1}. ${a.scenario} → ${a.choice}`).join("\n"),
        {
          type: "object",
          additionalProperties: false,
          required: ["title", "description", "imagePrompt"],
          properties: { title: { type: "string" }, description: { type: "string" }, imagePrompt: { type: "string" } },
        },
      )) as GameResult;
    } catch (e) {
      throw friendly(e);
    }
  });
