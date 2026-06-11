# Prompt: Fix Whitespace Title Validation

Users can create issues whose title is only spaces. Reproduce this with a failing
test, then fix the validation so create and update reject blank or whitespace-only
titles.

Constraints:

- Keep the app dependency-free.
- Preserve the existing API response shape.
- Return a `400` from the API for whitespace-only titles.
- Run `bun test` before you finish.

Expected outcome:

- The store rejects `"   "` titles.
- The API returns a validation error for whitespace-only titles.
- Existing issue creation with normal titles still works.
