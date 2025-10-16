"use client";

import type {
	CommentOnIssueIntentEvent,
	LinkIssuesIntentEvent,
	SearchGitHubIntentEvent,
	UpdateGitHubIssueIntentEvent,
} from "@hitl/ai/schemas";
import type { ReactElement } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SearchGitHubIntentContent({
	data,
}: {
	data: SearchGitHubIntentEvent["data"];
}): ReactElement {
	return (
		<Card className="w-full">
			<CardHeader className="pb-2">
				<CardTitle className="flex items-center gap-2 text-sm">
					<Badge variant="outline">Search GitHub</Badge>
					<span className="text-muted-foreground">{data.type}</span>
				</CardTitle>
			</CardHeader>
			<CardContent className="pt-0">
				<div className="space-y-2">
					<div>
						<span className="font-medium text-sm">Query:</span>
						<p className="text-muted-foreground text-sm">{data.query}</p>
					</div>
					{data.filters.length > 0 && (
						<div>
							<span className="font-medium text-sm">Filters:</span>
							<div className="mt-1 flex flex-wrap gap-1">
								{data.filters.map((filter, idx) => (
									<Badge key={idx} variant="secondary" className="text-xs">
										{filter}
									</Badge>
								))}
							</div>
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
}

export function UpdateGitHubIssueIntentContent({
	data,
}: {
	data: UpdateGitHubIssueIntentEvent["data"];
}): ReactElement {
	return (
		<Card className="w-full">
			<CardHeader className="pb-2">
				<CardTitle className="flex items-center gap-2 text-sm">
					<Badge variant="outline">Update Issue</Badge>
					<span className="text-muted-foreground">#{data.issue_number}</span>
				</CardTitle>
			</CardHeader>
			<CardContent className="pt-0">
				<div className="space-y-2">
					{data.title && (
						<div>
							<span className="font-medium text-sm">Title:</span>
							<p className="text-muted-foreground text-sm">{data.title}</p>
						</div>
					)}
					{data.body && (
						<div>
							<span className="font-medium text-sm">Body:</span>
							<p className="line-clamp-3 text-muted-foreground text-sm">
								{data.body}
							</p>
						</div>
					)}
					{data.labels && data.labels.length > 0 && (
						<div>
							<span className="font-medium text-sm">Labels:</span>
							<div className="mt-1 flex flex-wrap gap-1">
								{data.labels.map((label, idx) => (
									<Badge key={idx} variant="outline" className="text-xs">
										{label}
									</Badge>
								))}
							</div>
						</div>
					)}
					{data.state && (
						<div>
							<span className="font-medium text-sm">State:</span>
							<Badge
								variant={data.state === "open" ? "default" : "secondary"}
								className="ml-2"
							>
								{data.state}
							</Badge>
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
}

export function CommentOnIssueIntentContent({
	data,
}: {
	data: CommentOnIssueIntentEvent["data"];
}): ReactElement {
	return (
		<Card className="w-full">
			<CardHeader className="pb-2">
				<CardTitle className="flex items-center gap-2 text-sm">
					<Badge variant="outline">Add Comment</Badge>
					<span className="text-muted-foreground">#{data.issue_number}</span>
				</CardTitle>
			</CardHeader>
			<CardContent className="pt-0">
				<div>
					<span className="font-medium text-sm">Comment:</span>
					<p className="mt-1 text-muted-foreground text-sm">{data.comment}</p>
				</div>
			</CardContent>
		</Card>
	);
}

export function LinkIssuesIntentContent({
	data,
}: {
	data: LinkIssuesIntentEvent["data"];
}): ReactElement {
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
					<Badge variant="outline">Link Issues</Badge>
				</CardTitle>
			</CardHeader>
			<CardContent className="pt-0">
				<div className="space-y-2">
					<div className="flex items-center gap-2">
						<Badge variant="secondary">#{data.source_issue}</Badge>
						<span className="text-muted-foreground text-sm">
							{relationshipLabels[data.relationship]}
						</span>
						<Badge variant="secondary">#{data.target_issue}</Badge>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
