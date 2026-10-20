import { describe, expect, it } from 'vitest';
import { GameService, awaitingName, type SessionRepository, type StoredSession } from './service';
import { MockGameProvider } from './provider';

function fixture() {
  // Test-only repository. Production uses durable storage and revision filters.
  const rows = new Map<string, StoredSession & { owner: string }>();
  const repository: SessionRepository = {
    async create(owner, session) { rows.set(session.sessionId, { owner, session: structuredClone(session), revision: 0 }); },
    async read(owner, id) { const row = rows.get(id); return row?.owner === owner ? structuredClone(row) : null; },
    async replace(owner, id, revision, session) {
      const row = rows.get(id);
      if (!row || row.owner !== owner || row.revision !== revision) return false;
      rows.set(id, { owner, session: structuredClone(session), revision: revision + 1 }); return true;
    },
    async revoke(owner, id, revision) {
      const row = rows.get(id);
      if (!row || row.owner !== owner || row.revision !== revision) return false;
      rows.delete(id); return true;
    },
  };
  return { service: new GameService(repository, new MockGameProvider()), rows };
}

describe('Mock API game rules', () => {
  it('has awaiting_name before a session exists', () => {
    expect(awaitingName().status).toBe('awaiting_name');
    expect(awaitingName().questionNumber).toBe(0);
    expect(awaitingName().ending).toBeNull();
  });
  it('asks ten questions with A/B/C and only shows ending after answer ten', async () => {
    const { service } = fixture();
    let state = await service.start('owner', 'เทา');
    const id = state.sessionId;
    if (!id) throw new Error('No session');
    for (let n = 1; n <= 10; n++) {
      expect(state.status).toBe('playing');
      expect(state.questionNumber).toBe(n);
      expect(state.ending).toBeNull();
      expect(state.choices.map(c => c.letter)).toEqual(['A', 'B', 'C']);
      expect(state.characterIds).toContain('player');
      const choice = state.choices[0];
      if (!state.questionId || !choice) throw new Error('Missing question');
      state = await service.answer('owner', id, state.questionId, choice.choiceId);
    }
    expect(state.status).toBe('finished');
    expect(state.history).toHaveLength(10);
    expect(state.choices).toEqual([]);
    expect(state.ending?.rewardId).toBe(state.ending?.endingId);
  });
  it('rejects wrong choice without progressing', async () => {
    const { service } = fixture(); const s = await service.start('o', 'เทา');
    if (!s.sessionId) throw new Error('No session');
    await expect(service.answer('o', s.sessionId, 's1', 's2-warn')).rejects.toMatchObject({ status: 400 });
    expect((await service.state('o', s.sessionId)).questionNumber).toBe(1);
  });
  it('rejects stale question without progressing', async () => {
    const { service } = fixture(); const s = await service.start('o', 'เทา');
    if (!s.sessionId) throw new Error('No session');
    await service.answer('o', s.sessionId, 's1', 's1-eat');
    await expect(service.answer('o', s.sessionId, 's1', 's1-eat')).rejects.toMatchObject({ status: 409 });
    expect((await service.state('o', s.sessionId)).questionNumber).toBe(2);
  });
  it('accepts only one concurrent answer', async () => {
    const { service } = fixture(); const s = await service.start('o', 'เทา');
    if (!s.sessionId) throw new Error('No session');
    const id = s.sessionId;
    const results = await Promise.allSettled([service.answer('o', id, 's1', 's1-eat'), service.answer('o', id, 's1', 's1-follow')]);
    expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(1);
    expect((await service.state('o', id)).history).toHaveLength(1);
  });
  it('isolates session histories and refuses another owner', async () => {
    const { service } = fixture();
    const a = await service.start('a', 'หนึ่ง'); const b = await service.start('b', 'สอง');
    if (!a.sessionId || !b.sessionId) throw new Error('No session');
    await service.answer('a', a.sessionId, 's1', 's1-eat');
    expect((await service.state('b', b.sessionId)).history).toEqual([]);
    await expect(service.state('b', a.sessionId)).rejects.toMatchObject({ status: 404 });
  });
  it('restart clears history, gives a new id, revokes the old session', async () => {
    const { service } = fixture(); const s = await service.start('o', 'เทา');
    if (!s.sessionId) throw new Error('No session');
    await service.answer('o', s.sessionId, 's1', 's1-greet');
    const next = await service.restart('o', s.sessionId);
    expect(next.sessionId).not.toBe(s.sessionId);
    expect(next.wolfName).toBe('เทา');
    expect(next.history).toEqual([]);
    expect(next.questionNumber).toBe(1);
    await expect(service.state('o', s.sessionId)).rejects.toMatchObject({ status: 404 });
  });
  it('maps E1–E5 to the same reward ids from real answer paths', async () => {
    const paths = {
      E1: ['s1-greet', 's2-warn', 's3-fake', 's4-tell', 's5-throw', 's6-escape', 's7-glasses', 's8-cough', 's9-point', 's10-tell'],
      E2: ['s1-follow', 's2-warn', 's3-fake', 's4-tell', 's5-throw', 's6-escape', 's7-glasses', 's8-cough', 's9-point', 's10-quiet'],
      E3: ['s1-eat', 's2-meadow', 's3-no', 's4-hide', 's5-bush', 's6-leave', 's7-cat', 's8-answer', 's9-freeze', 's10-nap'],
      E4: ['s1-eat', 's2-ask', 's3-join', 's4-cover', 's5-lookout', 's6-lure', 's7-blanket', 's8-answer', 's9-grab', 's10-share'],
      E5: ['s1-eat', 's2-meadow', 's3-no', 's4-shrug', 's5-throw', 's6-leave', 's7-glasses', 's8-window', 's9-run', 's10-nap'],
    };
    for (const [ending, path] of Object.entries(paths)) {
      const { service } = fixture(); let s = await service.start('o', 'เทา');
      if (!s.sessionId) throw new Error('No session'); const id = s.sessionId;
      for (const choice of path) {
        if (!s.questionId) throw new Error('Missing question');
        s = await service.answer('o', id, s.questionId, choice);
      }
      expect(s.ending?.endingId).toBe(ending);
      expect(s.ending?.rewardId).toBe(ending);
    }
  });
});