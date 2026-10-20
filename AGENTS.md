<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
- The server-only provider factory in src/lib/game-ai.functions.ts is the sole future Botnoi integration boundary; no AI calls exist in Mock mode, so switching providers never requires rewriting the game UI.
- src/game/service.ts owns game transitions through GameProvider and SessionRepository interfaces; frontend consumes src/game/contract.ts via the four /api/game handlers to keep authoritative game state off the client.
- Mock sessions persist in wolf_mock_sessions with server-only grants, hashed HttpOnly browser ownership, expiry and revision compare-and-swap; this prevents cross-browser reads and concurrent duplicate progression on stateless hosting.
- Mock API and API Docs are development-only with server checks and no production access; production activation requires a separately reviewed access policy.
