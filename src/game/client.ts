import type { GameResponse } from './contract';

export async function gameRequest(operation: 'start' | 'answer' | 'state' | 'restart', data?: Record<string, string>): Promise<GameResponse> {
  const query = operation === 'state' && data?.sessionId ? `?sessionId=${encodeURIComponent(data.sessionId)}` : '';
  const response = await fetch(`/api/game/${operation}${query}`, {
    method: operation === 'state' ? 'GET' : 'POST', credentials: 'same-origin',
    headers: operation === 'state' ? undefined : { 'Content-Type': 'application/json' },
    body: operation === 'state' ? undefined : JSON.stringify(data),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error?.message ?? `HTTP ${response.status}`);
  return body as GameResponse;
}