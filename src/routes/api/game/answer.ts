import { createFileRoute } from '@tanstack/react-router';
export const Route = createFileRoute('/api/game/answer')({
  server: { handlers: { POST: async ({ request }) => {
    const { handleGame } = await import('@/game/http.server');
    return handleGame(request, 'answer');
  } } },
});
