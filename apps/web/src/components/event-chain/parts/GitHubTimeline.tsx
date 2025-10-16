"use client";

import type { Event } from "@hitl/ai/schemas";
import { GitBranchIcon } from "lucide-react";
import type { ReactElement } from "react";
import {
	CommentOnIssueIntentContent,
	LinkIssuesIntentContent,
	SearchGitHubIntentContent,
	UpdateGitHubIssueIntentContent,
} from "./events/GitHubIntentContent";
import { GitHubIssueResultContent } from "./events/GitHubIssueResult";
import { GitHubSearchResultContent } from "./events/GitHubSearchResult";

export function GitHubTimeline({ events }: { events: Event[] }): ReactElement {
	const githubEvents = events.filter(
		(e) =>
			e.type.includes("github") ||
			(e.type === "function_result" && e.data.fn?.includes("github")) ||
			e.type === "search_github" ||
			e.type === "update_github_issue" ||
			e.type === "comment_on_issue" ||
			e.type === "link_issues",
	);

	if (githubEvents.length === 0) {
		return (
			<div className="text-muted-foreground text-sm">
				No GitHub operations in this thread
			</div>
		);
	}

	return (
		<div className="space-y-3">
			<div className="font-medium text-sm">GitHub Operations Timeline</div>
			<div className="space-y-2">
				{githubEvents.map((event, idx) => (
					<div key={idx} className="flex items-start gap-3">
						<div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-muted">
							<GitBranchIcon className="h-4 w-4" />
						</div>
						<div className="min-w-0 flex-1">
							{event.type === "github_search_result" && (
								<GitHubSearchResultContent event={event} />
							)}
							{event.type === "function_result" &&
								event.data.fn?.includes("github") && (
									<GitHubIssueResultContent event={event} />
								)}
							{event.type === "search_github" && (
								<SearchGitHubIntentContent data={event.data as any} />
							)}
							{event.type === "update_github_issue" && (
								<UpdateGitHubIssueIntentContent data={event.data as any} />
							)}
							{event.type === "comment_on_issue" && (
								<CommentOnIssueIntentContent data={event.data as any} />
							)}
							{event.type === "link_issues" && (
								<LinkIssuesIntentContent data={event.data as any} />
							)}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
