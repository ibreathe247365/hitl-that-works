"use client";

import type { Event } from "@hitl/ai/schemas";
import type { ReactElement } from "react";
import {
	Task,
	TaskContent,
	TaskItem,
	TaskTrigger,
} from "@/components/ai-elements/task";
import { Badge } from "@/components/ui/badge";
import { AIResponseContent } from "./events/AIResponse";
import { AIStepContent } from "./events/AIStep";
import { HumanResponseContent } from "./events/HumanResponse";
import { QueueEventContent } from "./events/QueueEvent";
import { RequestMoreInformationContent } from "./events/RequestMoreInformation";
import { ToolCallContent } from "./events/ToolCall";
import { UserMessageContent } from "./events/UserMessage";
import {
	WebhookOperationContent,
	WebhookReceivedContent,
} from "./events/WebhookEvents";
import { WebhookProcessedContent } from "./events/WebhookProcessed";
import {
	getEventLabel,
	getEventStatusBlinkClass,
	getEventStatusColor,
} from "./utils";

export function EventContent({ event }: { event: Event }): ReactElement {
	switch (event.type) {
		case "human_response":
			return <HumanResponseContent event={event} />;
		case "request_more_information":
			return <RequestMoreInformationContent event={event} />;
		case "user_message":
			return <UserMessageContent event={event} />;
		case "tool_call":
		case "function_call":
			return <ToolCallContent event={event} />;
		case "ai_response":
		case "assistant_message":
			return <AIResponseContent event={event} />;
		case "webhook_processed":
			return <WebhookProcessedContent event={event} />;
		case "ai_step":
			return <AIStepContent event={event} />;
		case "queue":
			return <QueueEventContent event={event} />;
		case "webhook_received":
			return <WebhookReceivedContent event={event} />;
		case "webhook":
			return <WebhookOperationContent event={event} />;
		default:
			return (
				<pre className="overflow-x-auto rounded-lg border bg-muted p-3 text-xs">
					{JSON.stringify(event.data, null, 2)}
				</pre>
			);
	}
}

export function CollapsibleEvent({ event }: { event: Event }): ReactElement {
	const label = getEventLabel(event);
	return (
		<Task defaultOpen={false}>
			<TaskTrigger title={label}>
				<div className="flex items-center gap-2">
					<span
						className={`inline-block size-2 rounded-full ${getEventStatusColor(event)} ${getEventStatusBlinkClass(event)}`}
					/>
					<Badge variant="outline" className="text-xs">
						{label}
					</Badge>
					<span className="text-muted-foreground text-xs">
						{new Date(
							((event.data as any)?.timestamp || Date.now()) as number,
						).toLocaleTimeString()}
					</span>
				</div>
			</TaskTrigger>
			<TaskContent>
				<TaskItem>
					<EventContent event={event} />
				</TaskItem>
			</TaskContent>
		</Task>
	);
}
