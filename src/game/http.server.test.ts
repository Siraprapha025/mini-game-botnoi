import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('./repository.server', () => ({ repository: {} }));
import { handleGame } from './http.server';
import { cleanWolfName } from './validation';

afterEach(() => vi.unstubAllEnvs());
describe('Mock access boundary', () => {
  it('denies every Mock API operation outside development', async () => {
    vi.stubEnv('DEV', false);
    for (const operation of ['start', 'answer', 'state', 'restart'] as const) {
      const r = await handleGame(new Request(`http://localhost/api/game/${operation}`), operation);
      expect(r.status).toBe(403);
      expect((await r.json()).error.code).toBe('DEVELOPMENT_ONLY');
    }
  });
  it('denies cross-origin requests even in development', async () => {
    vi.stubEnv('DEV', true);
    const r = await handleGame(new Request('http://localhost/api/game/start', { method: 'POST', headers: { Origin: 'https://other.example' } }), 'start');
    expect(r.status).toBe(403);
    expect((await r.json()).error.code).toBe('ORIGIN_DENIED');
  });
  it('refuses empty wolf names and names longer than 24 characters', () => {
    expect(cleanWolfName('   ')).toBeNull();
    expect(cleanWolfName('ก'.repeat(25))).toBeNull();
    expect(cleanWolfName('ก'.repeat(24))).toBe('ก'.repeat(24));
  });
});