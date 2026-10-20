import { createFileRoute } from '@tanstack/react-router';
export const Route = createFileRoute('/api/game/state')({
  server: { handlers: { GET: async ({ request }) => {
    const { handleGame } = await import('@/game/http.server');
    return handleGame(request, 'state');
  } } },
});
