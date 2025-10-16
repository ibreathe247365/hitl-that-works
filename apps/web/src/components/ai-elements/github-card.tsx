"use client";

import type { GitHubSearchResultEvent } from "@hitl/ai/schemas";
import { formatDistanceToNow } from "date-fns";
import type { ComponentProps } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type GitHubIssue = GitHubSearchResultEvent["data"]["results"][0];

export type GitHubIssueCardProps = ComponentProps<"div"> & {
	issue: GitHubIssue;
};

export function GitHubIssueCard({
	issue,
	className,
	...props
}: GitHubIssueCardProps) {
	return (
		<div
			className={cn("space-y-3 rounded-lg border bg-card p-4", className)}
			{...props}
		>
			<div className="flex items-start justify-between gap-2">
				<a
					href={issue.html_url}
					target="_blank"
					rel="noreferrer"
					className="font-medium text-sm hover:underline"
				>
					#{issue.number} {issue.title}
				</a>
				<Badge variant={issue.state === "open" ? "default" : "secondary"}>
					{issue.state}
				</Badge>
			</div>

			{issue.labels.length > 0 && (
				<div className="flex flex-wrap gap-1">
					{issue.labels.map((label) => (
						<Badge key={label} variant="outline" className="text-xs">
							{label}
						</Badge>
					))}
				</div>
			)}

			<div className="text-muted-foreground text-xs">
				Updated {formatDistanceToNow(new Date(issue.updated_at))} ago
			</div>
		</div>
	);
}
