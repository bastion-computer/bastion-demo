import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, test } from "bun:test";
import { createFetchHandler } from "./server";
import { IssueStore } from "./store";

describe("API handler", () => {
  test("creates issues and returns summary stats", async () => {
    const handler = await createTestHandler();

    const createResponse = await handler(
      jsonRequest("/api/issues", "POST", {
        title: "Add labels",
        description: "Allow grouping work by component.",
        status: "in-progress",
        priority: "high",
      }),
    );

    expect(createResponse.status).toBe(201);

    const created = (await createResponse.json()) as { id: string; status: string };
    expect(created.id).toStartWith("ISS-");
    expect(created.status).toBe("in-progress");

    const statsResponse = await handler(new Request("http://demo.test/api/stats"));
    expect(statsResponse.status).toBe(200);

    const stats = (await statsResponse.json()) as { total: number; open: number; byPriority: { high: number } };
    expect(stats.total).toBe(1);
    expect(stats.open).toBe(1);
    expect(stats.byPriority.high).toBe(1);
  });

  test("returns validation errors as 400 responses", async () => {
    const handler = await createTestHandler();
    const response = await handler(jsonRequest("/api/issues", "POST", { priority: "high" }));

    expect(response.status).toBe(400);

    const body = (await response.json()) as { error: string };
    expect(body.error).toContain("title");
  });

  test("updates and deletes issues", async () => {
    const handler = await createTestHandler();
    const createResponse = await handler(jsonRequest("/api/issues", "POST", { title: "Remove me" }));
    const created = (await createResponse.json()) as { id: string };

    const updateResponse = await handler(jsonRequest(`/api/issues/${created.id}`, "PATCH", { status: "done" }));
    expect(updateResponse.status).toBe(200);

    const updated = (await updateResponse.json()) as { status: string };
    expect(updated.status).toBe("done");

    const deleteResponse = await handler(new Request(`http://demo.test/api/issues/${created.id}`, { method: "DELETE" }));
    expect(deleteResponse.status).toBe(200);

    const listResponse = await handler(new Request("http://demo.test/api/issues"));
    const list = (await listResponse.json()) as { issues: unknown[] };
    expect(list.issues).toEqual([]);
  });
});

async function createTestHandler(): Promise<(request: Request) => Promise<Response>> {
  const directory = await mkdtemp(join(tmpdir(), "bastion-demo-api-"));
  await mkdir(directory, { recursive: true });

  const issuesFile = join(directory, "issues.json");
  await writeFile(issuesFile, '{"issues":[]}\n');

  return createFetchHandler(new IssueStore(issuesFile));
}

function jsonRequest(pathname: string, method: string, body: unknown): Request {
  return new Request(`http://demo.test${pathname}`, {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}
