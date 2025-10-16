"use client";

import type { Event, GitHubSearchResultEvent } from "@hitl/ai/schemas";
import type { ReactElement } from "react";
import { GitHubIssueCard } from "@/components/ai-elements/github-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function GitHubSearchResultContent({
	event,
}: {
	event: Event;
}): ReactElement {
	const data = event.data as GitHubSearchResultEvent["data"];

	if (!data.results || !Array.isArray(data.results)) {
		return (
			<Card className="w-full">
				<CardContent className="pt-6">
					<div className="text-center text-muted-foreground text-sm">
						No search results found
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="w-full">
			<CardHeader className="pb-2">
				<CardTitle className="flex items-center gap-2 text-sm">
					<Badge variant="outline">Search Results</Badge>
					<span className="text-muted-foreground">
						{data.total_count} {data.type} found
					</span>
				</CardTitle>
			</CardHeader>
			<CardContent className="pt-0">
				<div className="space-y-2">
					<div className="mb-3 text-muted-foreground text-sm">
						Query: "{data.query}"
					</div>
					{data.results.map((issue) => (
						<GitHubIssueCard key={issue.number} issue={issue} />
					))}
				</div>
			</CardContent>
		</Card>
	);
}

export function GitHubSearchResultStep({
	event,
}: {
	event: Event;
}): ReactElement {
	return <GitHubSearchResultContent event={event} />;
}
