# Prompt: Refactor The API Router

Refactor `src/server.ts` so the API routing is easier to extend without changing
runtime behavior.

Constraints:

- Keep the same endpoints and response payloads.
- Do not add dependencies or a framework.
- Keep static file serving working.
- Add or adjust tests if the refactor exposes useful boundaries.
- Run `bun test` before you finish.

Suggested direction:

- Extract issue API routing from the top-level request handler.
- Keep validation and not-found errors mapped to the same status codes.
- Make future routes like labels, comments, or search easy to add.
