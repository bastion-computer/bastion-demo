# Prompt: Expand API Test Coverage

Increase confidence in the HTTP API by adding tests around edge cases that are
not covered yet.

Add tests for:

- `GET /api/health`.
- Unknown API routes returning `404`.
- Invalid JSON returning `400`.
- Updating an unknown issue returning `404`.
- Deleting an unknown issue returning `404`.

Constraints:

- Do not add dependencies.
- Keep tests fast and isolated with temporary data files.
- Run `bun test` before you finish.
