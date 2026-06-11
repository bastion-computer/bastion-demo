# Prompt: Add Labels To Issues

Add first-class labels to the issue tracker.

Feature requirements:

- Store labels as a string array on each issue.
- Allow labels when creating and updating issues through the API.
- Show labels on issue cards in the UI.
- Add a simple label text field to the create form. Comma-separated input is fine.
- Seed at least one issue with labels.
- Add tests for create/update behavior.

Constraints:

- Keep the app dependency-free.
- Keep existing data files readable if `labels` is missing.
- Run `bun test` before you finish.
