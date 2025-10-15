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
import { AIResponseStep } from "./events/AIResponse";
import { AIStepStep } from "./events/AIStep";
import { CalculateResultStep } from "./events/CalculateResult";
import { ErrorEventStep } from "./events/Error";
import { HumanContactSentStep } from "./events/HumanContactSent";
import { HumanResponseStep } from "./events/HumanResponse";
import {
	CalculateIntentStep,
	DoneForNowIntentStep,
	NothingToDoIntentStep,
} from "./events/IntentEvents";
import { QueueEventStep } from "./events/QueueEvent";
import { RequestMoreInformationStep } from "./events/RequestMoreInformation";
import { ThreadCreatedStep } from "./events/ThreadCreated";
import { ToolCallContent } from "./events/ToolCall";
import { UserMessageStep } from "./events/UserMessage";
import {
	WebhookOperationStep,
	WebhookReceivedStep,
} from "./events/WebhookEvents";
import { WebhookProcessedStep } from "./events/WebhookProcessed";
import { getEventStatusBlinkClass, getEventStatusColor } from "./utils";

export function EventContentStepList({
	events,
}: {
	events: Event[];
}): ReactElement {
	return (
		<>
			{events.map((currentEvent, index) => {
				switch (currentEvent.type) {
					case "thread_created":
						return <ThreadCreatedStep key={index} event={currentEvent} />;
					case "human_response":
						return <HumanResponseStep key={index} event={currentEvent} />;
					case "request_more_information":
						return (
							<RequestMoreInformationStep key={index} event={currentEvent} />
						);
					case "user_message":
						return <UserMessageStep key={index} event={currentEvent} />;
					case "error":
						return <ErrorEventStep key={index} event={currentEvent} />;
					case "tool_call":
					case "function_call":
						return <ToolCallContent key={index} event={currentEvent} />;
					case "ai_response":
					case "assistant_message":
						return <AIResponseStep key={index} event={currentEvent} />;
					case "webhook_processed":
						return <WebhookProcessedStep key={index} event={currentEvent} />;
					case "ai_step":
						return <AIStepStep key={index} event={currentEvent} />;
					case "queue":
						return <QueueEventStep key={index} event={currentEvent} />;
					case "webhook_received":
						return <WebhookReceivedStep key={index} event={currentEvent} />;
					case "webhook":
						return <WebhookOperationStep key={index} event={currentEvent} />;
					case "calculate":
						return <CalculateIntentStep key={index} event={currentEvent} />;
					case "done_for_now":
						return <DoneForNowIntentStep key={index} event={currentEvent} />;
					case "nothing_to_do":
						return <NothingToDoIntentStep key={index} event={currentEvent} />;
					case "calculate_result":
						return <CalculateResultStep key={index} event={currentEvent} />;
					case "human_contact_sent":
						return <HumanContactSentStep key={index} event={currentEvent} />;
					default:
						return (
							<Task key={index} defaultOpen={currentEvent.type === "ai_step"}>
								<TaskTrigger title={`${currentEvent.type} Event`}>
									<div className="flex items-center gap-2">
										<span
											className={`inline-block size-2 rounded-full ${getEventStatusColor(currentEvent)} ${getEventStatusBlinkClass(currentEvent)}`}
										/>
										<Badge variant="outline" className="text-xs">
											{currentEvent.type}
										</Badge>
										<span className="text-muted-foreground text-xs">
											{new Date(
												((currentEvent.data as any).timestamp ||
													Date.now()) as number,
											).toLocaleTimeString()}
										</span>
									</div>
								</TaskTrigger>
								<TaskContent>
									<TaskItem>
										<pre className="overflow-x-auto rounded-lg border bg-muted p-3 text-xs">
											{JSON.stringify(currentEvent.data, null, 2)}
										</pre>
									</TaskItem>
								</TaskContent>
							</Task>
						);
				}
			})}
		</>
	);
}
