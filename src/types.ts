export const ISSUE_STATUSES = ["todo", "in-progress", "done"] as const;
export const ISSUE_PRIORITIES = ["low", "medium", "high"] as const;

export type IssueStatus = (typeof ISSUE_STATUSES)[number];
export type IssuePriority = (typeof ISSUE_PRIORITIES)[number];

export interface Issue {
  id: string;
  title: string;
  description: string;
  status: IssueStatus;
  priority: IssuePriority;
  assignee?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IssueCreateInput {
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  assignee?: string;
}

export interface IssueUpdateInput {
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  assignee?: string;
}

export function isIssueStatus(value: unknown): value is IssueStatus {
  return typeof value === "string" && ISSUE_STATUSES.includes(value as IssueStatus);
}

export function isIssuePriority(value: unknown): value is IssuePriority {
  return typeof value === "string" && ISSUE_PRIORITIES.includes(value as IssuePriority);
}
