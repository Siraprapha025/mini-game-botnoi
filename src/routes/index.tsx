import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { createImage, createQuestions, createResult, type GameResult, type Question } from "@/lib/game-ai.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "คุณคือใคร? มินิเกมทายบุคลิกกับ AI" },
      { name: "description", content: "ตอบ 10 สถานการณ์สุดแปลก แล้วให้ AI บอกว่าคุณคือใคร" },
      { property: "og:title", content: "คุณคือใคร? มินิเกมทายบุคลิกกับ AI" },
      { property: "og:description", content: "ตอบ 10 สถานการณ์สุดแปลก แล้วให้ AI บอกว่าคุณคือใคร" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Game,
});

type Phase = "start" | "loading" | "play" | "thinking" | "result" | "error";

function Doodle({ src, alt }: { src: string | null | undefined; alt: string }) {
  return (
    <div className="sketch-box aspect-square w-full overflow-hidden bg-card">
      {src ? (
        <img src={src} alt={alt} className="h-full w-full object-cover animate-in fade-in" />
      ) : (
        <div className="flex h-full items-center justify-center font-display text-xl text-muted-foreground animate-pulse">
          กำลังวาดภาพ...
        </div>
      )}
    </div>
  );
}

function Game() {
  const getQuestions = useServerFn(createQuestions);
  const getImage = useServerFn(createImage);
  const getResult = useServerFn(createResult);

  const [phase, setPhase] = useState<Phase>("start");
  const [error, setError] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [images, setImages] = useState<Record<number, string | null>>({});
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<{ scenario: string; choice: string }[]>([]);
  const [result, setResult] = useState<GameResult | null>(null);
  const [resultImg, setResultImg] = useState<string | null>(null);

  const loadImage = (i: number, qs: Question[]) => {
    if (!qs[i] || i in images) return;
    setImages((m) => ({ ...m, [i]: null }));
    getImage({ data: { prompt: qs[i].imagePrompt } }).then((url) =>
      setImages((m) => ({ ...m, [i]: url ?? "" })),
    );
  };

  useEffect(() => {
    if (phase === "play") {
      loadImage(idx, questions);
      loadImage(idx + 1, questions);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, idx, questions]);

  const start = async () => {
    setPhase("loading");
    setImages({});
    setAnswers([]);
    setIdx(0);
    setResult(null);
    setResultImg(null);
    try {
      setQuestions(await getQuestions());
      setPhase("play");
    } catch (e) {
      setError((e as Error).message);
      setPhase("error");
    }
  };

  const finish = async (all: typeof answers) => {
    setPhase("thinking");
    try {
      const r = await getResult({ data: { answers: all } });
      setResult(r);
      setPhase("result");
      setResultImg(await getImage({ data: { prompt: r.imagePrompt } }));
    } catch (e) {
      setError((e as Error).message);
      setPhase("error");
    }
  };

  const choose = (choice: string) => {
    const all = [...answers, { scenario: questions[idx]?.scenario ?? "", choice }];
    setAnswers(all);
    if (idx + 1 >= questions.length) finish(all);
    else setIdx(idx + 1);
  };

  const q = questions[idx];

  return (
    <main className="paper min-h-screen px-5 py-8">
      <div className="sketch-frame mx-auto flex min-h-[85vh] max-w-md flex-col gap-6 bg-background p-6">
        {phase === "start" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
            <p className="font-display text-lg text-primary">มินิเกมทายบุคลิก</p>
            <h1 className="font-display text-6xl leading-tight">คุณคือใคร?</h1>
            <p className="text-muted-foreground">ตอบ 10 สถานการณ์สุดแปลก แล้วให้ AI บอกว่าคุณคืออะไร</p>
            <button onClick={start} className="sketch-btn sketch-btn-primary px-10 py-4 font-display text-2xl">
              เริ่มเล่น
            </button>
          </div>
        )}

        {(phase === "loading" || phase === "thinking") && (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <div className="h-14 w-14 animate-spin rounded-full border-4 border-foreground border-t-primary" />
            <p className="font-display text-2xl">
              {phase === "loading" ? "AI กำลังคิดสถานการณ์..." : "AI กำลังวิเคราะห์ตัวคุณ..."}
            </p>
          </div>
        )}

        {phase === "play" && q && (
          <>
            <div className="flex items-center gap-3">
              <div className="h-3 flex-1 overflow-hidden rounded-full border-2 border-foreground">
                <div className="h-full bg-primary transition-all" style={{ width: `${(idx / questions.length) * 100}%` }} />
              </div>
              <span className="font-display">{idx + 1}/{questions.length}</span>
            </div>
            <Doodle src={images[idx]} alt={q.scenario} />
            <h2 className="font-display text-2xl leading-snug">{q.scenario}</h2>
            <div className="flex flex-col gap-3">
              {q.options.map((o, i) => (
                <button key={i} onClick={() => choose(o)} className="sketch-btn flex gap-3 px-4 py-3 text-left">
                  <span className="font-display text-xl">{"ABC"[i]}.</span>
                  <span className="pt-0.5">{o}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {phase === "result" && result && (
          <div className="flex flex-col gap-5 animate-in fade-in">
            <p className="text-center font-display text-lg text-primary">คุณคือ...</p>
            <Doodle src={resultImg} alt={result.title} />
            <h2 className="text-center font-display text-4xl">{result.title}</h2>
            <div>
              <p className="font-display text-xl">คำบรรยาย</p>
              <p className="mt-2 leading-relaxed text-muted-foreground">{result.description}</p>
            </div>
            <button onClick={start} className="sketch-btn sketch-btn-primary py-3 font-display text-xl">
              เล่นอีกครั้ง
            </button>
          </div>
        )}

        {phase === "error" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <p className="font-display text-2xl">อุ๊ย!</p>
            <p className="text-muted-foreground">{error}</p>
            <button onClick={start} className="sketch-btn sketch-btn-primary px-8 py-3 font-display text-xl">
              ลองใหม่
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
