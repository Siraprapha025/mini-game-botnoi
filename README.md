# หมาป่าหลงนิทาน — Mock / API Test

Temporary deterministic story testing only. No Botnoi connection, Agent creation, Lovable AI or other model calls. No new generated images. No publish action was performed.

## Open
- Game: `/` in the development preview.
- Live tester: select **API Docs** or open `/api-docs` in development.
- Tester and all Mock APIs are disabled outside development. No admin system or production tester is implied. Published preview builds may not expose this development-only tool; use the running development preview/local `bun run dev`.
- Start in the tester with `{"wolfName":"เทา"}` and Send. Answer auto-fills the sessionId, current questionId and first valid choice. GET state converts the JSON editor's sessionId into a query parameter. Repeated/old answers return HTTP 409.

## Changed / added source
- `src/routes/index.tsx`: named-wolf story screen, three choices, ten-question progression, results, restart. Only API responses drive play.
- `src/components/game-scene.tsx`: displays existing backgrounds and separately identified player/villain sprites.
- `src/game/client.ts`, `contract.ts`, `validation.ts`: frontend HTTP adapter, central response contract, shared name validation. Browser stores only a session id; never authoritative history or scores.
- `src/game/service.ts`: authoritative sessions, question/choice validation, endings, restart; accepts replaceable GameProvider and SessionRepository interfaces.
- `src/game/repository.server.ts`: durable session storage in Lovable Cloud. Server-only grants/RLS; owner-cookie hashes, 24-hour expiry and atomic revision-checked updates. Restart clears and revokes the old row. Cookie is HttpOnly/SameSite Strict and Secure on HTTPS.
- `src/game/http.server.ts`: schema validation, origin and development restrictions, session ownership and JSON errors.
- `src/routes/api/game/{start,answer,state,restart}.ts`: actual web API handlers, dynamically load server implementation.
- `src/lib/game-ai.functions.ts`: replaced old AI implementation with the sole future provider factory. No AI SDK or model invocation.
- `src/routes/api-docs.tsx`: editable JSON, Send, HTTP status and live JSON/error output, automatic session carry-over, endpoint examples.
- `src/game/provider.ts`: reused Mock provider; shared name validation re-exported for compatibility.
- `src/game/engine.ts`: preserved story/ending rules, removed a non-null assertion.
- `src/styles.css`, `src/routes/__root.tsx`: story display rules and game metadata.
- `src/game/service.test.ts`, `src/game/http.server.test.ts`: new regression/access tests; existing engine/routing tests retained.
- `drizzle/migrations/0000_wolf_mock_sessions.sql`: session table with explicit server-only grants and RLS.
- `AGENTS.md`, `roadmap.md`, this README: boundaries, checklist and integration handoff.
- Cloud-generated clients/types and dependencies were provisioned automatically. AI was not enabled or used.

Existing `src/game/story.ts`, `engine.ts` and `assets.ts` are reused; legacy `storage.ts` is not called by the new game. State is not accepted from the client.

## API contract
| Method | Web endpoint | Input | Success |
|---|---|---|---|
| POST | `/api/game/start` | `{wolfName}` | 201, playing question 1 |
| POST | `/api/game/answer` | `{sessionId,questionId,choiceId}` | 200, next question or ending |
| GET | `/api/game/state?sessionId=...` | query sessionId; omitted = awaiting_name | 200 |
| POST | `/api/game/restart` | `{sessionId}` | 201, new id and empty history |

All return the central `GameResponse`: sessionId, status (`awaiting_name`, `playing`, `finished`), mode, wolfName, questionNumber, totalQuestions, questionId, sceneId, locationId, characterIds, placements, title, narrative, question, choices, ending and history. The sceneId is `s1`–`s10` (branch-specific locationId determines the asset) or `ending-E1`–`ending-E5`. Choice ids come from the current question; letters are A/B/C. No effects/scores are accepted in request bodies. Ending contains matching endingId/rewardId E1–E5 plus the fixed reward and answer-derived fortune. Session reads require the same owner browser cookie even if a sessionId is known.

Errors: 400 malformed/invalid input or choice, 403 non-development/cross-origin, 404 unknown/expired/revoked/other-owner session, 409 duplicate/concurrent/stale answer, 413 oversized request, 415 wrong content type, 500 storage unavailable. Responses use no-store.

## Assets and source-document limitation
Existing imported files are present (15/15):
- `bg-apple-tree.jpg`, `bg-crossroads.jpg`, `bg-deep-forest.jpg`, `bg-grandma-house.jpg`, `bg-grandma-room.jpg`.
- `player-wolf.gif`, `villain-wolf.gif`, `little-red-riding-hood.gif`, `grandmother.gif`, `huntsman.gif`.
- `apple-e1.png`, `apple-e2.png`, `apple-e3.png`, `apple-e4.png`, `apple-e5.png`.

`assets.ts` maps locations, characterIds and reward/endingIds to these exact existing files. No replacement images were generated/downloaded. Their original upload provenance cannot be independently established from the available files.

**Missing: `มินิเกมเว็บAI.txt`.** It is not available in either upload mount or this checkout. The existing branching Mock script is used provisionally. Alignment with the user's source document, ending rules and reward wording is unverified until that document is supplied; no claim of exact document compliance is made.

## Verification
- Existing + added tests: `bunx vitest run src/game/engine.test.ts src/game/service.test.ts src/game/http.server.test.ts src/test/app-routing.test.tsx`.
- Browser end-to-end: enter a name, answer all ten questions, observe final image/reward, restart to question 1.
- Real HTTP APIs: all five fixed E1–E5 paths; ending and reward ids match; no ending before answer ten.
- Wrong choices (400), stale/repeated/concurrent answers (409), only one concurrent update.
- Two sessions in the same browser retain separate histories; a different browser cannot read either session.
- Restart yields a new id with empty history and the old id becomes inaccessible.
- Empty/too-long names and cross-origin requests rejected.
- API Docs Send returns actual 201/200 API data, carries sessionId forward and shows invalid-JSON errors.
- Desktop and narrow viewport checked; displayed scene/player/reward images loaded. No runtime errors or AI requests observed.
- Production denial is covered by access tests; no production deployment was performed.

## Next Botnoi step — not implemented
Provide the existing Agent identifier and official API documentation: actual base URL/endpoint, method, authentication scheme, request/response examples (including errors), conversation/session ids, reset/end semantics, rate limits, timeout expectations and any supported structured-output format. Do not paste the secret key in chat or Git; it will be collected through server-side secrets when connection is explicitly requested.

Implement a Botnoi provider and response validator/adapter at the single `src/lib/game-ai.functions.ts` boundary, then explicitly select it instead of Mock. The frontend and internal API contract remain unchanged. Production access/rate-limiting and admin testing policy must be reviewed separately before enabling non-development access.
