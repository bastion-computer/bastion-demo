import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { isIssuePriority, isIssueStatus, type Issue, type IssueCreateInput, type IssueUpdateInput } from "./types";

interface IssueDataFile {
  issues: Issue[];
}

const defaultIssuesFile = fileURLToPath(new URL("../data/issues.json", import.meta.url));
const defaultSeedFile = fileURLToPath(new URL("../data/issues.seed.json", import.meta.url));

export class ValidationError extends Error {}

export class NotFoundError extends Error {}

export class IssueStore {
  constructor(
    private readonly filePath = process.env.ISSUES_FILE ?? defaultIssuesFile,
    private readonly seedPath = defaultSeedFile,
  ) {}

  async list(): Promise<Issue[]> {
    const data = await this.readData();
    return [...data.issues].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }

  async get(id: string): Promise<Issue | undefined> {
    const data = await this.readData();
    return data.issues.find((issue) => issue.id === id);
  }

  async create(input: IssueCreateInput): Promise<Issue> {
    if (!input.title) {
      throw new ValidationError("title is required");
    }

    const status = input.status ?? "todo";
    const priority = input.priority ?? "medium";

    if (!isIssueStatus(status)) {
      throw new ValidationError(`unsupported status: ${status}`);
    }

    if (!isIssuePriority(priority)) {
      throw new ValidationError(`unsupported priority: ${priority}`);
    }

    const now = new Date().toISOString();
    const issue: Issue = {
      id: `ISS-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      title: input.title.trim(),
      description: input.description?.trim() ?? "",
      status,
      priority,
      assignee: cleanOptionalText(input.assignee),
      createdAt: now,
      updatedAt: now,
    };

    const data = await this.readData();
    data.issues.push(issue);
    await this.writeData(data);
    return issue;
  }

  async update(id: string, input: IssueUpdateInput): Promise<Issue> {
    const data = await this.readData();
    const index = data.issues.findIndex((issue) => issue.id === id);

    if (index === -1) {
      throw new NotFoundError(`issue not found: ${id}`);
    }

    const current = data.issues[index];
    const next: Issue = {
      ...current,
      updatedAt: new Date().toISOString(),
    };

    if (input.title !== undefined) {
      if (!input.title) {
        throw new ValidationError("title is required");
      }

      next.title = input.title.trim();
    }

    if (input.description !== undefined) {
      next.description = input.description.trim();
    }

    if (input.status !== undefined) {
      if (!isIssueStatus(input.status)) {
        throw new ValidationError(`unsupported status: ${input.status}`);
      }

      next.status = input.status;
    }

    if (input.priority !== undefined) {
      if (!isIssuePriority(input.priority)) {
        throw new ValidationError(`unsupported priority: ${input.priority}`);
      }

      next.priority = input.priority;
    }

    if (input.assignee !== undefined) {
      next.assignee = cleanOptionalText(input.assignee);
    }

    data.issues[index] = next;
    await this.writeData(data);
    return next;
  }

  async remove(id: string): Promise<Issue> {
    const data = await this.readData();
    const index = data.issues.findIndex((issue) => issue.id === id);

    if (index === -1) {
      throw new NotFoundError(`issue not found: ${id}`);
    }

    const [removed] = data.issues.splice(index, 1);
    await this.writeData(data);
    return removed;
  }

  private async readData(): Promise<IssueDataFile> {
    try {
      const contents = await readFile(this.filePath, "utf8");
      const parsed = JSON.parse(contents) as IssueDataFile;
      return { issues: Array.isArray(parsed.issues) ? parsed.issues : [] };
    } catch (error) {
      if (!isNotFoundError(error)) {
        throw error;
      }

      const seed = await readFile(this.seedPath, "utf8");
      const parsed = JSON.parse(seed) as IssueDataFile;
      await this.writeData(parsed);
      return parsed;
    }
  }

  private async writeData(data: IssueDataFile): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, `${JSON.stringify(data, null, 2)}\n`);
  }
}

function cleanOptionalText(value: string | undefined): string | undefined {
  const cleaned = value?.trim();
  return cleaned ? cleaned : undefined;
}

function isNotFoundError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}
