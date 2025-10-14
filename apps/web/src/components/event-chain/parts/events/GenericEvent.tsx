"use client";

import type { Event } from "@hitl/ai/schemas";
import {
	Task,
	TaskContent,
	TaskItem,
	TaskTrigger,
} from "@/components/ai-elements/task";
import { Badge } from "@/components/ui/badge";

export function GenericEventCollapsible({
	event,
	indexKey,
}: {
	event: Event;
	indexKey: string | number;
}) {
	const timestamp =
		typeof (event.data as any)?.timestamp === "number"
			? (event.data as any).timestamp
			: Date.now();

	return (
		<Task key={indexKey} defaultOpen={false}>
			<TaskTrigger title={`${event.type} Event`}>
				<div className="flex items-center gap-2">
					<Badge variant="outline" className="text-xs">
						{event.type}
					</Badge>
					<span className="text-muted-foreground text-xs">
						{new Date(timestamp).toLocaleTimeString()}
					</span>
				</div>
			</TaskTrigger>
			<TaskContent>
				<TaskItem>
					<pre className="overflow-x-auto rounded-lg border bg-muted p-3 text-xs">
						{JSON.stringify(event.data, null, 2)}
					</pre>
				</TaskItem>
			</TaskContent>
		</Task>
	);
}
