import { createFileRoute } from '@tanstack/react-router';
export const Route = createFileRoute('/api/game/restart')({
  server: { handlers: { POST: async ({ request }) => {
    const { handleGame } = await import('@/game/http.server');
    return handleGame(request, 'restart');
  } } },
});
