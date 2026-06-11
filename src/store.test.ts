import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, test } from "bun:test";
import { IssueStore, NotFoundError, ValidationError } from "./store";

describe("IssueStore", () => {
  test("creates, lists, updates, and removes issues", async () => {
    const store = await createEmptyStore();

    const created = await store.create({
      title: "Write demo README",
      description: "Make the Bastion walkthrough practical.",
      priority: "high",
      assignee: "Ada",
    });

    expect(created.id).toStartWith("ISS-");
    expect(created.status).toBe("todo");
    expect(created.title).toBe("Write demo README");

    const updated = await store.update(created.id, { status: "done", assignee: "" });
    expect(updated.status).toBe("done");
    expect(updated.assignee).toBeUndefined();

    const issues = await store.list();
    expect(issues).toHaveLength(1);
    expect(issues[0].id).toBe(created.id);

    const removed = await store.remove(created.id);
    expect(removed.id).toBe(created.id);
    expect(await store.list()).toEqual([]);
  });

  test("rejects unsupported status and priority values", async () => {
    const store = await createEmptyStore();

    await expect(store.create({ title: "Bad status", status: "blocked" })).rejects.toThrow(ValidationError);
    await expect(store.create({ title: "Bad priority", priority: "urgent" })).rejects.toThrow(ValidationError);
  });

  test("throws when updating an unknown issue", async () => {
    const store = await createEmptyStore();

    await expect(store.update("ISS-missing", { status: "done" })).rejects.toThrow(NotFoundError);
  });
});

async function createEmptyStore(): Promise<IssueStore> {
  const directory = await mkdtemp(join(tmpdir(), "bastion-demo-"));
  await mkdir(directory, { recursive: true });

  const issuesFile = join(directory, "issues.json");
  await writeFile(issuesFile, '{"issues":[]}\n');

  return new IssueStore(issuesFile);
}
