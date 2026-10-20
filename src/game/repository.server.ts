import { supabaseAdmin } from '@/integrations/supabase/client.server';
import type { Json } from '@/integrations/supabase/types';
import type { GameSession } from './types';
import type { SessionRepository } from './service';

const json = (s: GameSession) => JSON.parse(JSON.stringify(s)) as Json;
export const repository: SessionRepository = {
  async create(owner, session) {
    const { error } = await supabaseAdmin.from('wolf_mock_sessions').insert({ id: session.sessionId, owner_hash: owner, session: json(session) });
    if (error) throw error;
  },
  async read(owner, id) {
    const { data, error } = await supabaseAdmin.from('wolf_mock_sessions').select('session, revision').eq('id', id).eq('owner_hash', owner).eq('revoked', false).gt('expires_at', new Date().toISOString()).maybeSingle();
    if (error) throw error;
    return data ? { session: data.session as unknown as GameSession, revision: data.revision } : null;
  },
  async replace(owner, id, revision, session) {
    const { data, error } = await supabaseAdmin.from('wolf_mock_sessions').update({ session: json(session), revision: revision + 1 }).eq('id', id).eq('owner_hash', owner).eq('revision', revision).eq('revoked', false).gt('expires_at', new Date().toISOString()).select('id');
    if (error) throw error;
    return data.length === 1;
  },
  async revoke(owner, id, revision) {
    const { data, error } = await supabaseAdmin.from('wolf_mock_sessions').update({ revoked: true, revision: revision + 1, session: {} }).eq('id', id).eq('owner_hash', owner).eq('revision', revision).eq('revoked', false).select('id');
    if (error) throw error;
    return data.length === 1;
  },
};
