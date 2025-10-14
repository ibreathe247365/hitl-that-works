"use client";

import type { ReactElement } from "react";
import type { Event } from "@hitl/ai/schemas";
import { Task, TaskContent, TaskItem, TaskTrigger } from "@/components/ai-elements/task";
import { Badge } from "@/components/ui/badge";
import { getEventStatusBlinkClass, getEventStatusColor } from "./utils";
import { UserMessageStep } from "./events/UserMessage";
import { ToolCallContent } from "./events/ToolCall";
import { AIResponseStep } from "./events/AIResponse";
import { WebhookProcessedStep } from "./events/WebhookProcessed";
import { HumanResponseStep } from "./events/HumanResponse";
import { RequestMoreInformationStep } from "./events/RequestMoreInformation";
import { AIStepStep } from "./events/AIStep";
import { QueueEventStep } from "./events/QueueEvent";
import { WebhookOperationStep, WebhookReceivedStep } from "./events/WebhookEvents";

export function EventContentStepList({ events }: { events: Event[] }): ReactElement {
    return (
        <>
            {events.map((currentEvent, index) => {
                switch (currentEvent.type) {
                    case "human_response":
                        return <HumanResponseStep key={index} event={currentEvent} />;
                    case "request_more_information":
                        return <RequestMoreInformationStep key={index} event={currentEvent} />;
                    case "user_message":
                        return <UserMessageStep key={index} event={currentEvent} />;
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
                    default:
                        return (
                            <Task key={index} defaultOpen={currentEvent.type === "ai_step"}>
                                <TaskTrigger title={`${currentEvent.type} Event`}>
                                    <div className="flex items-center gap-2">
                                        <span className={`inline-block size-2 rounded-full ${getEventStatusColor(currentEvent)} ${getEventStatusBlinkClass(currentEvent)}`} />
                                        <Badge variant="outline" className="text-xs">{currentEvent.type}</Badge>
                                        <span className="text-muted-foreground text-xs">{new Date(((currentEvent.data as any).timestamp || Date.now()) as number).toLocaleTimeString()}</span>
                                    </div>
                                </TaskTrigger>
                                <TaskContent>
                                    <TaskItem>
                                        <pre className="overflow-x-auto rounded-lg border bg-muted p-3 text-xs">{JSON.stringify(currentEvent.data, null, 2)}</pre>
                                    </TaskItem>
                                </TaskContent>
                            </Task>
                        );
                }
            })}
        </>
    );
}


