// Single server-side integration boundary for the future existing Botnoi Agent.
// No AI SDK, model calls, credentials, endpoint guesses, or Agent creation.
import { MockGameProvider } from '@/game/provider';
import type { GameProvider } from '@/game/types';

export function getGameProvider(): GameProvider {
  return new MockGameProvider();
}
// Future: implement GameProvider using the user's verified Botnoi API documentation,
// adapt responses to the internal contract, then swap only this factory.
// Credentials must be read inside server handlers from server-side secrets.
