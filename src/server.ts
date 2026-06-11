import { summarizeIssues } from "./stats";
import { IssueStore, NotFoundError, ValidationError } from "./store";

const publicDirectory = new URL("../public/", import.meta.url);

export function createFetchHandler(store = new IssueStore()): (request: Request) => Promise<Response> {
  return async function handleRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);

    try {
      if (url.pathname === "/api/health" && request.method === "GET") {
        return json({ status: "ok" });
      }

      if (url.pathname === "/api/issues" && request.method === "GET") {
        return json({ issues: await store.list() });
      }

      if (url.pathname === "/api/issues" && request.method === "POST") {
        return json(await store.create(await readJson(request)), 201);
      }

      if (url.pathname === "/api/stats" && request.method === "GET") {
        return json(summarizeIssues(await store.list()));
      }

      const issueRoute = url.pathname.match(/^\/api\/issues\/([^/]+)$/);
      if (issueRoute && request.method === "PATCH") {
        return json(await store.update(decodeURIComponent(issueRoute[1]), await readJson(request)));
      }

      if (issueRoute && request.method === "DELETE") {
        return json(await store.remove(decodeURIComponent(issueRoute[1])));
      }

      if (url.pathname.startsWith("/api/")) {
        return json({ error: "not found" }, 404);
      }

      return serveStaticFile(url.pathname);
    } catch (error) {
      if (error instanceof ValidationError) {
        return json({ error: error.message }, 400);
      }

      if (error instanceof NotFoundError) {
        return json({ error: error.message }, 404);
      }

      console.error(error);
      return json({ error: "internal server error" }, 500);
    }
  };
}

async function readJson(request: Request): Promise<Record<string, string | undefined>> {
  try {
    return (await request.json()) as Record<string, string | undefined>;
  } catch {
    throw new ValidationError("request body must be valid JSON");
  }
}

async function serveStaticFile(pathname: string): Promise<Response> {
  const relativePath = pathname === "/" ? "index.html" : pathname.slice(1);

  if (!relativePath || relativePath.includes("..")) {
    return json({ error: "not found" }, 404);
  }

  const file = Bun.file(new URL(relativePath, publicDirectory));

  if (!(await file.exists())) {
    return json({ error: "not found" }, 404);
  }

  return new Response(file, {
    headers: {
      "content-type": contentTypeFor(relativePath),
    },
  });
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
    },
  });
}

function contentTypeFor(pathname: string): string {
  if (pathname.endsWith(".css")) {
    return "text/css; charset=utf-8";
  }

  if (pathname.endsWith(".js")) {
    return "application/javascript; charset=utf-8";
  }

  return "text/html; charset=utf-8";
}

if (import.meta.main) {
  const port = Number(process.env.PORT ?? "3000");
  Bun.serve({ port, fetch: createFetchHandler() });
  console.log(`Bastion demo tracker running on http://localhost:${port}`);
}
