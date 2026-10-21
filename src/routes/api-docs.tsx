import { createFileRoute, Link, notFound } from '@tanstack/react-router';
import { useState } from 'react';
import { ArrowLeft, Send, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { GameResponse } from '@/game/contract';

const endpoints = [
  { operation: 'start', method: 'POST', title: 'เริ่มเกม', description: 'รับชื่อหมาป่าและสร้าง session ใหม่ พร้อมข้อ 1 (ชื่อ 1–24 ตัวอักษร)', sample: { wolfName: 'เทา' } },
  { operation: 'answer', method: 'POST', title: 'ส่งคำตอบ', description: 'รับ sessionId, questionId และ choiceId ตรวจว่าตรงกับข้อปัจจุบันก่อนบันทึก คำตอบซ้ำคืน 409 โดยไม่ข้ามข้อ', sample: { sessionId: '', questionId: 's1', choiceId: 's1-eat' } },
  { operation: 'state', method: 'GET', title: 'อ่านสถานะ', description: 'ส่ง sessionId ใน query string เพื่ออ่านรอบเกม โดยไม่เปลี่ยนสถานะ ไม่ส่ง sessionId จะได้ awaiting_name', sample: { sessionId: '' } },
  { operation: 'restart', method: 'POST', title: 'เริ่มรอบใหม่', description: 'รับ sessionId ล้างข้อมูลและยกเลิกรอบเก่า สร้าง session ใหม่ด้วยชื่อเดิมและประวัติว่าง', sample: { sessionId: '' } },
] as const;
export const Route = createFileRoute('/api-docs')({
  beforeLoad: () => { if (!import.meta.env.DEV) throw notFound(); },
  head: () => ({ meta: [
    { title: 'API Docs & Test — หมาป่าหลงนิทาน Mock' },
    { name: 'description', content: 'เอกสารและทดสอบ API Mock ของเว็บหมาป่าหลงนิทาน เฉพาะ development ยังไม่เชื่อม Botnoi Agent' },
    { property: 'og:title', content: 'API Docs — หมาป่าหลงนิทาน' },
    { property: 'og:description', content: 'ทดสอบสี่ API ของเว็บในโหมด Mock ไม่ใช่ endpoint ของ Botnoi' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' },
  ] }), component: ApiDocs,
});
function ApiDocs() {
  const [selected, setSelected] = useState(0);
  const [json, setJson] = useState(JSON.stringify(endpoints[0].sample, null, 2));
  const [session, setSession] = useState<GameResponse | null>(null);
  const [response, setResponse] = useState('');
  const [status, setStatus] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const endpoint = endpoints[selected] ?? endpoints[0];
  function select(index: number) {
    const e = endpoints[index]; if (!e) return;
    setSelected(index); setError(''); setStatus(null); setResponse('');
    const body = e.operation === 'start' ? e.sample : e.operation === 'answer' ? {
      sessionId: session?.sessionId ?? '', questionId: session?.questionId ?? 's1', choiceId: session?.choices[0]?.choiceId ?? 's1-eat',
    } : { sessionId: session?.sessionId ?? '' };
    setJson(JSON.stringify(body, null, 2));
  }
  async function send() {
    setBusy(true); setError(''); setStatus(null);
    try {
      const body = JSON.parse(json);
      if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('กรุณาใส่ JSON object');
      const query = endpoint.method === 'GET' && body.sessionId ? `?sessionId=${encodeURIComponent(body.sessionId)}` : '';
      const r = await fetch(`/api/game/${endpoint.operation}${query}`, { method: endpoint.method, credentials: 'same-origin',
        ...(endpoint.method === 'POST' ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}) });
      const result = await r.json();
      setStatus(r.status); setResponse(JSON.stringify(result, null, 2));
      if (!r.ok) setError(result.error?.message ?? 'ส่งคำขอไม่สำเร็จ');
      else if (result.sessionId) {
        const s = result as GameResponse; setSession(s);
        if (endpoint.operation === 'answer') setJson(JSON.stringify({ sessionId: s.sessionId, questionId: s.questionId, choiceId: s.choices[0]?.choiceId ?? '' }, null, 2));
      }
    } catch (e) { setError(e instanceof Error ? e.message : 'ส่งคำขอไม่ได้'); }
    finally { setBusy(false); }
  }
  if (!import.meta.env.DEV) return null;
  return <main className="min-h-screen bg-background px-4 py-8">
    <div className="mx-auto max-w-6xl">
      <Button asChild variant="ghost" className="mb-6"><Link to="/"><ArrowLeft />กลับไปเล่นเกม</Link></Button>
      <header className="border-b-2 border-border pb-6"><p className="text-sm text-primary">DEVELOPMENT ONLY</p><h1 className="mt-2 flex items-center gap-3 font-display text-3xl"><Terminal /> API Docs / API Test</h1><p className="mt-3 font-medium">Mock — ยังไม่เชื่อม Botnoi Agent</p><p className="mt-2 text-sm text-muted-foreground">API ของเว็บหมาป่าหลงนิทาน ไม่ใช่ endpoint ของ Botnoi · คำขอจริงใช้รอบเกมจริงใน Mock</p></header>
      <div className="mt-6 grid gap-8 md:grid-cols-[230px_1fr]">
        <nav aria-label="Game API endpoints" className="flex flex-col gap-2">{endpoints.map((e, i) => <Button key={e.operation} variant={selected === i ? 'secondary' : 'ghost'} onClick={() => select(i)} disabled={busy} className="h-auto justify-start gap-3 px-3 py-3"><span className="w-10 text-xs font-bold text-primary">{e.method}</span><span>{e.title}</span></Button>)}
          <div className="mt-5 border-t border-border/20 pt-4 text-sm"><p className="font-medium">Session ปัจจุบัน</p><p className="mt-2 break-all font-mono text-xs text-muted-foreground">{session?.sessionId ?? 'ยังไม่มี session'}</p><p className="mt-2">{session ? `${session.status} · ข้อ ${session.questionNumber}/10` : 'awaiting_name'}</p></div>
        </nav>
        <section className="min-w-0">
          <h2 className="font-mono text-lg font-bold">{endpoint.method} /api/game/{endpoint.operation}</h2><p className="mt-3 leading-relaxed text-muted-foreground">{endpoint.description}</p>
          <p className="mt-3 text-sm text-muted-foreground">ใช้คุกกี้ HttpOnly ของเบราว์เซอร์เจ้าของรอบ · หมดอายุ 24 ชั่วโมง · API ใช้เล่นเกมบนเว็บที่เผยแพร่ได้ ส่วนหน้าทดสอบเปิดเฉพาะ development</p>
          <details className="my-5 border-y border-border/20 py-3"><summary className="cursor-pointer text-sm font-medium">ตัวอย่าง request / response และสัญญาข้อมูล</summary>
            <pre className="mt-3 overflow-x-auto rounded-md bg-muted p-4 text-xs">{JSON.stringify(endpoint.sample, null, 2)}</pre>
            <p className="my-3 text-sm">ตัวอย่างโครงสร้างเท่านั้น ไม่ใช่ผลจากปุ่ม Send:</p>
            <pre className="overflow-x-auto rounded-md bg-muted p-4 text-xs">{JSON.stringify({ sessionId: '<session uuid>', status: endpoint.operation === 'state' ? 'awaiting_name | playing | finished' : 'playing', mode: 'mock', questionNumber: 1, totalQuestions: 10, sceneId: 's1', questionId: 's1', characterIds: ['player'], narrative: ['เรื่องจากบท Mock'], question: 'คุณจะทำอย่างไรต่อ?', choices: [{ choiceId: 's1-eat', letter: 'A', label: 'กัดแอปเปิ้ลต่อ ทำเป็นไม่ได้ยิน' }], ending: null }, null, 2)}</pre>
            <p className="mt-3 text-sm">finished: ไม่มีคำถามหรือตัวเลือก; ending มี endingId และ rewardId เดียวกัน (E1–E5), title, summary, reward และ fortune</p>
            <p className="mt-2 text-sm">201 เริ่ม/เล่นใหม่ · 200 อ่าน/ตอบ · 400 ข้อมูลผิด · 404 ไม่พบรอบ · 409 ตอบซ้ำ/ข้อเก่า · 403 ไม่อนุญาต · 415 รูปแบบผิด · 500 บันทึกไม่ได้</p>
          </details>
          <label htmlFor="request-json" className="text-sm font-medium">{endpoint.method === 'GET' ? 'Query parameters (JSON)' : 'Request body (JSON)'}</label>
          <textarea id="request-json" value={json} onChange={e => setJson(e.target.value)} spellCheck={false} className="mt-2 min-h-44 w-full rounded-md border border-input bg-card p-4 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          <div className="mt-3 flex items-center justify-between"><Button onClick={send} disabled={busy}><Send />{busy ? 'Sending…' : 'Send'}</Button><span aria-live="polite" className="font-mono text-sm">HTTP {status ?? '—'}</span></div>
          {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
          <h3 className="mb-2 mt-6 text-sm font-medium">Response JSON</h3><pre aria-label="Response JSON" className="api-json max-h-[650px] min-h-40 overflow-auto p-4 font-mono text-xs leading-relaxed">{response || 'ยังไม่มี response'}</pre>
        </section>
      </div>
    </div>
  </main>;
}
