"use client";

import type { Event } from "@hitl/ai/schemas";
import type { ReactElement } from "react";
import { GitHubIssueCard } from "@/components/ai-elements/github-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function GitHubIssueResultContent({
	event,
}: {
	event: Event;
}): ReactElement {
	const data = (event.data || {}) as any;

	if (data.fn === "create_github_issue" || data.fn === "update_github_issue") {
		if (data.issue) {
			return <GitHubIssueCard issue={data.issue} />;
		}
	}

	if (data.fn === "comment_on_issue") {
		return (
			<Card className="w-full">
				<CardHeader className="pb-2">
					<CardTitle className="flex items-center gap-2 text-sm">
						<Badge variant="outline">Comment Added</Badge>
						<span className="text-muted-foreground">#{data.issue_number}</span>
					</CardTitle>
				</CardHeader>
				<CardContent className="pt-0">
					{data.html_url && (
						<a
							className="text-blue-600 text-xs underline hover:text-blue-800"
							href={String(data.html_url)}
							target="_blank"
							rel="noreferrer"
						>
							View comment on GitHub →
						</a>
					)}
				</CardContent>
			</Card>
		);
	}

	if (data.fn === "link_issues") {
		const relationshipLabels = {
			blocks: "Blocks",
			blocked_by: "Blocked By",
			relates_to: "Relates To",
			duplicates: "Duplicates",
		};

		return (
			<Card className="w-full">
				<CardHeader className="pb-2">
					<CardTitle className="flex items-center gap-2 text-sm">
						<Badge variant="outline">Issues Linked</Badge>
					</CardTitle>
				</CardHeader>
				<CardContent className="pt-0">
					<div className="flex items-center gap-2">
						<Badge variant="secondary">#{data.source_issue}</Badge>
						<span className="text-muted-foreground text-sm">
							{relationshipLabels[
								data.relationship as keyof typeof relationshipLabels
							] || data.relationship}
						</span>
						<Badge variant="secondary">#{data.target_issue}</Badge>
					</div>
				</CardContent>
			</Card>
		);
	}

	// Fallback for unknown function results - display structured data instead of JSON
	return (
		<Card className="w-full">
			<CardHeader className="pb-2">
				<CardTitle className="flex items-center gap-2 text-sm">
					<Badge variant="outline">GitHub Operation</Badge>
					<span className="text-muted-foreground">{data.fn || "Unknown"}</span>
				</CardTitle>
			</CardHeader>
			<CardContent className="pt-0">
				<div className="space-y-2 text-sm">
					{Object.entries(data).map(([key, value]) => {
						if (key === "fn") return null;
						return (
							<div key={key}>
								<span className="font-medium capitalize">
									{key.replace(/_/g, " ")}:
								</span>
								<span className="ml-2 text-muted-foreground">
									{typeof value === "object"
										? JSON.stringify(value)
										: String(value)}
								</span>
							</div>
						);
					})}
				</div>
			</CardContent>
		</Card>
	);
}
