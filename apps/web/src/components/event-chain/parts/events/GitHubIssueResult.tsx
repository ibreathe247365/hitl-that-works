"use client";

import type { Event } from "@hitl/ai/schemas";

export function GitHubIssueResultContent({ event }: { event: Event }) {
  const data = (event.data || {}) as any;
  if (data.fn !== "create_github_issue" || !data.issue) {
    return (
      <pre className="overflow-x-auto rounded-lg border bg-muted p-3 text-xs">
        {JSON.stringify(event.data, null, 2)}
      </pre>
    );
  }
  const issue = data.issue || {};
  return (
    <div className="space-y-1 text-sm">
      <div className="font-medium">GitHub Issue Created</div>
      {typeof issue.number !== "undefined" && (
        <div>Issue #{String(issue.number)}</div>
      )}
      {issue.url && (
        <a
          className="text-blue-600 underline"
          href={String(issue.url)}
          target="_blank"
          rel="noreferrer"
        >
          {String(issue.url)}
        </a>
      )}
    </div>
  );
}


