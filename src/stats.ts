import { ISSUE_PRIORITIES, ISSUE_STATUSES, type Issue, type IssuePriority, type IssueStatus } from "./types";

export interface IssueSummary {
  total: number;
  open: number;
  done: number;
  byStatus: Record<IssueStatus, number>;
  byPriority: Record<IssuePriority, number>;
}

export function summarizeIssues(issues: Issue[]): IssueSummary {
  const byStatus = Object.fromEntries(ISSUE_STATUSES.map((status) => [status, 0])) as Record<IssueStatus, number>;
  const byPriority = Object.fromEntries(ISSUE_PRIORITIES.map((priority) => [priority, 0])) as Record<IssuePriority, number>;

  for (const issue of issues) {
    byStatus[issue.status] += 1;
    byPriority[issue.priority] += 1;
  }

  return {
    total: issues.length,
    open: byStatus.todo + byStatus["in-progress"],
    done: byStatus.done,
    byStatus,
    byPriority,
  };
}
