import { z } from 'zod';
import { GameError } from './contract';
import { GameService, awaitingName } from './service';
import { repository } from './repository.server';
import { getGameProvider } from '@/lib/game-ai.functions';
import { cleanWolfName } from './provider';

const idSchema = z.string().uuid();
const startSchema = z.object({ wolfName: z.string().max(100).transform(cleanWolfName).refine(n => n !== null, 'ชื่อหมาป่าต้องมี 1–24 ตัวอักษร') }).strict();
const sessionSchema = z.object({ sessionId: idSchema }).strict();
const answerSchema = sessionSchema.extend({ questionId: z.string().regex(/^s(?:[1-9]|10)$/), choiceId: z.string().min(1).max(80) }).strict();
export type Operation = 'start' | 'answer' | 'state' | 'restart';

export async function handleGame(request: Request, operation: Operation): Promise<Response> {
  const headers = new Headers({ 'Cache-Control': 'no-store', 'Content-Type': 'application/json' });
  try {
    // This temporary Mock API is intentionally disabled in production builds.
    if (!import.meta.env.DEV) throw new GameError(403, 'DEVELOPMENT_ONLY', 'Mock API เปิดเฉพาะ development');
    const origin = request.headers.get('origin');
    if ((origin && origin !== new URL(request.url).origin) || request.headers.get('sec-fetch-site') === 'cross-site')
      throw new GameError(403, 'ORIGIN_DENIED', 'ไม่อนุญาตคำขอจากเว็บอื่น');
    const cookie = request.headers.get('cookie')?.split(';').map(v => v.trim()).find(v => v.startsWith('wolf_mock_owner='))?.slice('wolf_mock_owner='.length);
    let token = cookie && /^[a-f0-9]{64}$/.test(cookie) ? cookie : null;
    if (!token && operation !== 'start') {
      if (operation === 'state' && !new URL(request.url).searchParams.has('sessionId')) return Response.json(awaitingName(), { headers });
      throw new GameError(404, 'SESSION_NOT_FOUND', 'ไม่พบรอบเกมในเบราว์เซอร์นี้');
    }
    if (!token) {
      token = Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, '0')).join('');
      headers.set('Set-Cookie', `wolf_mock_owner=${token}; HttpOnly; SameSite=Strict; Path=/api/game; Max-Age=86400${new URL(request.url).protocol === 'https:' ? '; Secure' : ''}`);
    }
    const owner = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))), b => b.toString(16).padStart(2, '0')).join('');
    const service = new GameService(repository, getGameProvider());
    let result;
    if (operation === 'state') {
      const id = new URL(request.url).searchParams.get('sessionId');
      result = id === null ? awaitingName() : await service.state(owner, idSchema.parse(id));
    } else {
      if (!request.headers.get('content-type')?.includes('application/json')) throw new GameError(415, 'JSON_REQUIRED', 'กรุณาส่ง application/json');
      const raw = await request.text();
      if (raw.length > 4096) throw new GameError(413, 'BODY_TOO_LARGE', 'คำขอยาวเกินกำหนด');
      const input: unknown = JSON.parse(raw);
      if (operation === 'start') {
        const { wolfName } = startSchema.parse(input);
        if (!wolfName) throw new GameError(400, 'INVALID_NAME', 'กรุณาใส่ชื่อหมาป่า');
        result = await service.start(owner, wolfName);
      } else if (operation === 'answer') {
        const d = answerSchema.parse(input);
        result = await service.answer(owner, d.sessionId, d.questionId, d.choiceId);
      } else {
        result = await service.restart(owner, sessionSchema.parse(input).sessionId);
      }
    }
    return Response.json(result, { status: operation === 'start' || operation === 'restart' ? 201 : 200, headers });
  } catch (e) {
    if (e instanceof GameError) return Response.json({ error: { code: e.code, message: e.message } }, { status: e.status, headers });
    if (e instanceof z.ZodError || e instanceof SyntaxError) return Response.json({ error: { code: 'INVALID_REQUEST', message: e instanceof z.ZodError ? e.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ') : 'JSON ไม่ถูกต้อง' } }, { status: 400, headers });
    console.error('Mock game request failed');
    return Response.json({ error: { code: 'SERVER_ERROR', message: 'บันทึกรอบเกมไม่ได้ กรุณาลองใหม่' } }, { status: 500, headers });
  }
}
