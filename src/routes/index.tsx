import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, BookOpen, RotateCcw, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GameScene } from '@/components/game-scene';
import { APPLES } from '@/game/assets';
import { cleanWolfName } from '@/game/provider';
import { MOCK_LABEL, type GameResponse } from '@/game/contract';
import { gameRequest } from '@/game/client';

export const Route = createFileRoute('/')({
  head: () => ({ meta: [
    { title: 'หมาป่าหลงนิทาน — มินิเกมนิทาน 10 ทางเลือก' },
    { name: 'description', content: 'เป็นหมาป่าธรรมดาที่หลงเข้าไปในนิทานหนูน้อยหมวกแดง เลือกทางของคุณและพบแอปเปิ้ลประจำฉากจบ ในโหมดทดสอบ Mock' },
    { property: 'og:title', content: 'หมาป่าหลงนิทาน' },
    { property: 'og:description', content: 'สิบทางเลือกของหมาป่าธรรมดาในนิทานหนูน้อยหมวกแดง — ยังไม่เชื่อม Botnoi Agent' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' },
  ] }), component: Game,
});
const SESSION_KEY = 'wolf-mock-session-id';

function Game() {
  const [game, setGame] = useState<GameResponse | null>(null);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [restoring, setRestoring] = useState(true);
  const [error, setError] = useState('');
  const lock = useRef(false);
  useEffect(() => {
    let active = true;
    const id = sessionStorage.getItem(SESSION_KEY);
    if (!id) { setRestoring(false); return; }
    gameRequest('state', { sessionId: id }).then(s => { if (active) setGame(s); }).catch(() => {
      sessionStorage.removeItem(SESSION_KEY);
    }).finally(() => { if (active) setRestoring(false); });
    return () => { active = false; };
  }, []);

  const run = async (operation: 'start' | 'answer' | 'restart', data: Record<string, string>) => {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try {
      const s = await gameRequest(operation, data);
      setGame(s);
      if (s.sessionId) sessionStorage.setItem(SESSION_KEY, s.sessionId);
    } catch (e) { setError(e instanceof Error ? e.message : 'กรุณาลองใหม่'); }
    finally { lock.current = false; setBusy(false); }
  };
  const playing = game?.status === 'playing';
  const ending = game?.ending;
  const start = (event: React.FormEvent) => {
    event.preventDefault(); const value = cleanWolfName(name);
    if (!value) { setError('ตั้งชื่อหมาป่า 1–24 ตัวอักษรนะ'); return; }
    void run('start', { wolfName: value });
  };
  return <main className="paper min-h-screen px-4 py-6 sm:py-10">
    <div className="mx-auto max-w-4xl">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-2 font-display text-lg"><BookOpen size={22} /> หมาป่าหลงนิทาน</Link>
        {import.meta.env.DEV && <Button asChild variant="outline" size="sm"><Link to="/api-docs"><Terminal /> API Docs</Link></Button>}
      </header>
      <p className="mb-5 flex items-center gap-2 text-sm font-medium text-muted-foreground"><span className="h-2 w-2 rounded-full bg-primary" />{MOCK_LABEL}</p>
      {!import.meta.env.DEV && <p role="alert" className="mb-4 text-destructive">โหมด Mock เปิดเฉพาะ development</p>}
      {restoring ? <p className="py-20 text-center font-display text-xl">กำลังอ่านรอบเกม…</p> : !game || game.status === 'awaiting_name' ? <>
        <section className="tale-cover border-3 border-foreground bg-secondary">
          <GameScene location="apple-tree" characters={[{ id: 'player', x: 74, height: 54 }]} />
          <div className="tale-cover-copy">
            <p className="mb-3 font-display text-sm text-primary">นิทานหนูน้อยหมวกแดง · บทใหม่ของคุณ</p>
            <h1 className="font-display text-4xl leading-snug sm:text-5xl">หมาป่า<br />หลงนิทาน</h1>
            <p className="mt-4 leading-relaxed">วันนี้คุณเป็นหมาป่าธรรมดาอีกตัว<br />ไม่ใช่หมาป่าตัวร้ายในนิทาน</p>
            <form onSubmit={start} className="mt-5 space-y-3">
              <label htmlFor="wolf-name" className="block text-sm font-medium">หมาป่าของคุณชื่ออะไร?</label>
              <input id="wolf-name" value={name} onChange={e => setName(e.target.value)} maxLength={100} placeholder="ชื่อหมาป่า" required disabled={busy} className="w-full rounded-md border-2 border-input bg-background px-3 py-3 outline-none focus:ring-2 focus:ring-ring" />
              <Button type="submit" disabled={busy || !import.meta.env.DEV} className="sketch-btn sketch-btn-primary h-auto w-full py-3 font-display text-lg">{busy ? 'กำลังเปิดนิทาน…' : 'เริ่มผจญภัย'}<ArrowRight /></Button>
            </form>
          </div>
        </section>
        <div className="flex justify-between gap-3 py-5 text-sm text-muted-foreground"><span>10 คำถาม · 3 ทางเลือก</span><span>5 ฉากจบ · 5 แอปเปิ้ล</span></div>
      </> : <>
        <div className="mb-4 flex items-center justify-between gap-4">
          <span className="font-display">หมาป่า {game.wolfName}</span>
          <span className="text-sm text-muted-foreground">{playing ? `ข้อ ${game.questionNumber} / 10` : 'นิทานจบแล้ว · 10 / 10'}</span>
        </div>
        <progress className="tale-progress mb-4" max={10} value={playing ? game.questionNumber - 1 : 10} aria-label="คำถามที่ตอบแล้ว" />
        <section className="overflow-hidden rounded-md border-3 border-foreground bg-background">
          <GameScene location={game.locationId} characters={game.characters} />
          <div className="p-5 sm:p-8">
            <p className="mb-2 text-sm text-primary">{playing ? `บทที่ ${game.questionNumber}` : `ฉากจบ ${ending?.endingId}`}</p>
            <h1 className="font-display text-2xl leading-snug sm:text-3xl">{game.title}</h1>
            <div className="mt-4 space-y-3 leading-loose">{game.narrative.map((p, i) => <p key={i}>{p}</p>)}</div>
            {playing && <>
              <h2 className="mt-6 font-display text-xl">{game.question}</h2>
              <div className="mt-4 grid gap-3">{game.choices.map(c => <Button key={c.choiceId} variant="outline" disabled={busy} onClick={() => {
                if (game.sessionId && game.questionId) void run('answer', { sessionId: game.sessionId, questionId: game.questionId, choiceId: c.choiceId });
              }} className="tale-choice sketch-btn px-4 py-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary font-display">{c.letter}</span><span>{c.label}</span></Button>)}</div>
            </>}
            {ending && <div className="mt-6 border-t-2 border-border pt-6">
              <div className="flex flex-col items-center gap-4 sm:flex-row">
                <img src={APPLES[ending.rewardId] ?? undefined} alt={ending.reward.name} className="h-40 w-40 shrink-0 object-contain" />
                <div><p className="text-sm text-primary">แอปเปิ้ลของคุณ · {ending.rewardId}</p><h2 className="mt-1 font-display text-2xl">{ending.reward.name}</h2><p className="mt-2 text-sm text-muted-foreground">{ending.reward.color} · {ending.reward.pattern}</p><p className="mt-3 leading-relaxed">{ending.reward.power}</p></div>
              </div>
              <p className="mt-5 leading-loose">{ending.fortune}</p>
            </div>}
          </div>
        </section>
        <div className="mt-5 flex flex-wrap justify-between gap-3">
          <Button variant="outline" disabled={busy} onClick={() => { if (game.sessionId) void run('restart', { sessionId: game.sessionId }); }}><RotateCcw />เล่นใหม่</Button>
          {ending && <Button variant="ghost" disabled={busy} onClick={async () => {
            if (game.sessionId) { await run('restart', { sessionId: game.sessionId }); sessionStorage.removeItem(SESSION_KEY); setGame(null); setName(''); }
          }}>ตั้งชื่อหมาป่าตัวใหม่<ArrowRight /></Button>}
        </div>
      </>}
      {error && <div role="alert" className="mt-4 rounded-md border border-destructive p-4 text-destructive">{error}{game?.sessionId && <Button variant="ghost" onClick={async () => {
        try { setGame(await gameRequest('state', { sessionId: game.sessionId ?? '' })); setError(''); } catch { setError('อ่านรอบเกมไม่ได้ กรุณาเริ่มใหม่'); }
      }}>อ่านสถานะล่าสุด</Button>}</div>}
      <footer className="mt-6 border-t border-border/20 py-4 text-center text-xs text-muted-foreground">หมาป่าหลงนิทาน · Mock สำหรับทดสอบเท่านั้น</footer>
    </div>
  </main>;
}
