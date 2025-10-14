"use client";

import type { Event } from "@hitl/ai/schemas";
import {
	Task,
	TaskContent,
	TaskItem,
	TaskTrigger,
} from "@/components/ai-elements/task";
import { Badge } from "@/components/ui/badge";
import { EventContent } from "./EventContent";
import {
	getEventLabel,
	getEventStatusBlinkClass,
	getEventStatusColor,
} from "./utils";

export function EventBranch({
	node,
	operationIdToChildren,
	eventIndex,
}: {
	node: Event;
	operationIdToChildren: Map<string, Event[]>;
	eventIndex: WeakMap<Event, number>;
}) {
	const nodeLabel = getEventLabel(node);
	const childList =
		operationIdToChildren.get(
			((node.data as any)?.operationId as string) || "",
		) || [];

	return (
		<Task defaultOpen={node.type === "ai_step"}>
			<TaskTrigger title={nodeLabel}>
				<div className="flex items-center gap-2">
					<span
						className={`inline-block size-2 rounded-full ${getEventStatusColor(node)} ${getEventStatusBlinkClass(node)}`}
					/>
					<Badge variant="outline" className="text-xs">
						{nodeLabel}
					</Badge>
					<span className="text-muted-foreground text-xs">
						{new Date(
							((node.data as any)?.timestamp || Date.now()) as number,
						).toLocaleTimeString()}
					</span>
				</div>
			</TaskTrigger>
			<TaskContent>
				<TaskItem>
					<EventContent event={node} />
				</TaskItem>
				{childList.map((child) => (
					<EventBranch
						key={
							(((child.data as any)?.operationId as string) ?? "child") +
							"-" +
							(eventIndex.get(child) ?? "na")
						}
						node={child}
						operationIdToChildren={operationIdToChildren}
						eventIndex={eventIndex}
					/>
				))}
			</TaskContent>
		</Task>
	);
}
