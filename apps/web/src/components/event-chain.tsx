"use client";

import type { Event } from "@hitl/ai/schemas";
import { formatDistanceToNow } from "date-fns";
import { BrainIcon, ClockIcon } from "lucide-react";
import {
	ChainOfThought,
	ChainOfThoughtContent,
	ChainOfThoughtHeader,
	ChainOfThoughtStep,
} from "@/components/ai-elements/chain-of-thought";
import {
	Task,
	TaskContent,
	TaskItem,
	TaskTrigger,
} from "@/components/ai-elements/task";
import {
	Tool,
	ToolContent,
	ToolHeader,
	ToolInput,
	ToolOutput,
} from "@/components/ai-elements/tool";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface EventChainProps {
	events: Event[];
}

export function EventChain({ events }: EventChainProps) {
    const formatRelativeTime = (timestamp?: string | number | Date) => {
        if (!timestamp) return null;
        return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    };

    const eventIndex = new WeakMap<Event, number>();
    for (let i = 0; i < events.length; i++) {
        eventIndex.set(events[i], i);
    }

	const operationIdToEvent = new Map<string, Event>();
	const operationIdToChildren = new Map<string, Event[]>();
	const eventsWithOperationId: Event[] = [];
	for (const currentEvent of events) {
		const operationId = (currentEvent.data as any)?.operationId as string | undefined;
		if (operationId) {
			operationIdToEvent.set(operationId, currentEvent);
			eventsWithOperationId.push(currentEvent);
		}
	}
	for (const currentEvent of eventsWithOperationId) {
		const parentOperationId = (currentEvent.data as any)?.parentOperationId as string | undefined;
		if (parentOperationId) {
			if (!operationIdToChildren.has(parentOperationId)) operationIdToChildren.set(parentOperationId, []);
			operationIdToChildren.get(parentOperationId)!.push(currentEvent);
		}
	}

	const rootOperationEvents: Event[] = [];
	for (const currentEvent of eventsWithOperationId) {
		const parentOperationId = (currentEvent.data as any)?.parentOperationId as string | undefined;
		if (!parentOperationId || !operationIdToEvent.has(parentOperationId)) {
			rootOperationEvents.push(currentEvent);
		}
	}

	const nonOperationEvents = events.filter((e) => !(e.data as any)?.operationId);

	const getEventLabel = (currentEvent: Event) => {
		switch (currentEvent.type) {
			case "user_message":
				return "User Message";
			case "tool_call":
			case "function_call":
				return currentEvent.data.name || currentEvent.data.function_name || "Tool Call";
			case "ai_response":
			case "assistant_message":
				return "AI Response";
			case "webhook_processed":
				return "Webhook Processed";
			default:
				return `${currentEvent.type} Event`;
		}
	};

	const renderEventContent = (currentEvent: Event) => {
		switch (currentEvent.type) {
			case "user_message":
				return (
					<div className="space-y-3">
						<div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800/30 dark:bg-blue-950/20">
							<p className="text-sm leading-relaxed">
								{currentEvent.data.message || currentEvent.data.text}
							</p>
						</div>
						{currentEvent.data.timestamp && (
							<div className="flex items-center gap-1 text-muted-foreground text-xs">
								<ClockIcon className="h-3 w-3" />
								{formatRelativeTime(currentEvent.data.timestamp)}
							</div>
						)}
					</div>
				);
			case "tool_call":
			case "function_call":
				return (
					<Tool defaultOpen={false}>
						<ToolHeader
							title={currentEvent.data.name || currentEvent.data.function_name}
							type={`tool-${currentEvent.type}` as const}
							state={
								(currentEvent.data.status === "in_progress" && "input-streaming") ||
								(currentEvent.data.status === "succeeded" && "output-available") ||
								(currentEvent.data.status === "failed" && "output-error") ||
								"input-available"
							}
						/>
						<ToolContent>
							<ToolInput input={currentEvent.data.arguments || currentEvent.data.input} />
							<ToolOutput output={currentEvent.data.result || currentEvent.data.output} errorText={currentEvent.data.error} />
						</ToolContent>
					</Tool>
				);
			case "ai_response":
			case "assistant_message":
				return (
					<div className="space-y-3">
						<div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800/30 dark:bg-green-950/20">
							<p className="text-sm leading-relaxed">
								{currentEvent.data.message || currentEvent.data.text}
							</p>
						</div>
						{currentEvent.data.timestamp && (
							<div className="flex items-center gap-1 text-muted-foreground text-xs">
								<ClockIcon className="h-3 w-3" />
								{formatRelativeTime(currentEvent.data.timestamp)}
							</div>
						)}
					</div>
				);
			case "webhook_processed":
				return (
					<div className="flex items-center gap-2">
						<Badge variant="secondary" className="text-xs">
							{currentEvent.data.payloadType}
						</Badge>
						<span className="text-muted-foreground text-xs">
							{formatRelativeTime(currentEvent.data.timestamp || Date.now())}
						</span>
						{currentEvent.data.durationMs && (
							<span className="text-muted-foreground text-xs">{`${currentEvent.data.durationMs}ms`}</span>
						)}
					</div>
				);
			default:
				return (
					<pre className="overflow-x-auto rounded-lg border bg-muted p-3 text-xs">
						{JSON.stringify(currentEvent.data, null, 2)}
					</pre>
				);
		}
	};

	const EventBranch = ({ node }: { node: Event }) => {
		const nodeLabel = getEventLabel(node);
		const childList = operationIdToChildren.get((node.data as any)?.operationId) || [];
		return (
			<Task defaultOpen={false}>
				<TaskTrigger title={nodeLabel}>
					<div className="flex items-center gap-2">
						<Badge variant="outline" className="text-xs">{nodeLabel}</Badge>
						<span className="text-muted-foreground text-xs">
							{new Date((node.data as any)?.timestamp || Date.now()).toLocaleTimeString()}
						</span>
					</div>
				</TaskTrigger>
				<TaskContent>
					<TaskItem>
						{renderEventContent(node)}
					</TaskItem>
                    {childList.map((child) => (
                        <EventBranch
                            key={((child.data as any)?.operationId ?? "child") + "-" + (eventIndex.get(child) ?? "na")}
                            node={child}
                        />
                    ))}
				</TaskContent>
			</Task>
		);
	};
	if (events.length === 0) {
		return (
			<Card className="h-full">
				<CardHeader className="pb-4">
					<CardTitle className="flex items-center gap-2 text-lg">
						<BrainIcon className="h-5 w-5 text-primary" />
						Event Chain
					</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-1 items-center justify-center">
					<div className="mx-auto max-w-sm py-12 text-center">
						<div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
							<BrainIcon className="h-8 w-8 text-muted-foreground" />
						</div>
						<h3 className="mb-2 font-semibold text-lg">No events yet</h3>
						<p className="mb-4 text-muted-foreground">
							Send a message to start the conversation and see AI processing
							events here.
						</p>
						<div className="rounded-lg border border-dashed bg-muted/50 p-4">
							<p className="text-muted-foreground text-sm">
								Events will appear here as the AI processes your requests and
								performs actions.
							</p>
						</div>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="h-full">
			<CardHeader className="pb-4">
				<CardTitle className="flex items-center gap-2 text-lg">
					<BrainIcon className="h-5 w-5 text-primary" />
					Event Chain
				</CardTitle>
			</CardHeader>
			<CardContent className="min-h-0 flex-1 p-0">
				<ScrollArea className="h-full px-6 pb-6">
					<ChainOfThought defaultOpen={true}>
						<ChainOfThoughtHeader>AI Processing Chain</ChainOfThoughtHeader>
						<ChainOfThoughtContent>
                            {rootOperationEvents.map((rootEvent) => (
                                <EventBranch
                                    key={((rootEvent.data as any)?.operationId ?? "root") + "-" + (eventIndex.get(rootEvent) ?? "na")}
                                    node={rootEvent}
                                />
                            ))}
							{nonOperationEvents.map((currentEvent, index) => {
                                switch (currentEvent.type) {
									case "user_message":
										return (
											<ChainOfThoughtStep
												key={index}
												label="User Message"
												description="User input received"
												status="complete"
											>
												<div className="space-y-3">
													<div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800/30 dark:bg-blue-950/20">
														<p className="text-sm leading-relaxed">
                                                            {currentEvent.data.message || currentEvent.data.text}
														</p>
													</div>
                                                    {currentEvent.data.timestamp && (
														<div className="flex items-center gap-1 text-muted-foreground text-xs">
															<ClockIcon className="h-3 w-3" />
                                                            {formatRelativeTime(currentEvent.data.timestamp)}
														</div>
													)}
												</div>
											</ChainOfThoughtStep>
										);

                                    case "tool_call":
                                    case "function_call":
										return (
											<Tool key={index} defaultOpen={false}>
                                                <ToolHeader
                                                    title={currentEvent.data.name || currentEvent.data.function_name}
                                                    type={`tool-${currentEvent.type}` as const}
                                                    state={
                                                        (currentEvent.data.status === "in_progress" && "input-streaming") ||
                                                        (currentEvent.data.status === "succeeded" && "output-available") ||
                                                        (currentEvent.data.status === "failed" && "output-error") ||
                                                        "input-available"
                                                    }
												/>
												<ToolContent>
													<ToolInput
                                                        input={currentEvent.data.arguments || currentEvent.data.input}
													/>
													<ToolOutput
                                                        output={currentEvent.data.result || currentEvent.data.output}
                                                        errorText={currentEvent.data.error}
													/>
												</ToolContent>
											</Tool>
										);

									case "ai_response":
									case "assistant_message":
										return (
											<ChainOfThoughtStep
												key={index}
												label="AI Response"
												description="Assistant response generated"
												status="complete"
											>
												<div className="space-y-3">
													<div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800/30 dark:bg-green-950/20">
														<p className="text-sm leading-relaxed">
                                                            {currentEvent.data.message || currentEvent.data.text}
														</p>
													</div>
                                                    {currentEvent.data.timestamp && (
														<div className="flex items-center gap-1 text-muted-foreground text-xs">
															<ClockIcon className="h-3 w-3" />
                                                            {formatRelativeTime(currentEvent.data.timestamp)}
														</div>
													)}
												</div>
											</ChainOfThoughtStep>
										);

                                    case "webhook_processed":
                                        return (
											<ChainOfThoughtStep
												key={index}
												label="Webhook Processed"
                                                description={`${currentEvent.data.payloadType} event processed`}
                                                status={
                                                    (currentEvent.data.status === "in_progress" && "active") ||
                                                    (currentEvent.data.status === "succeeded" && "complete") ||
                                                    (currentEvent.data.status === "failed" && "complete") ||
                                                    "pending"
                                                }
											>
												<div className="flex items-center gap-2">
													<Badge variant="secondary" className="text-xs">
                                                        {currentEvent.data.payloadType}
													</Badge>
													<span className="text-muted-foreground text-xs">
                                                        {formatRelativeTime(currentEvent.data.timestamp || Date.now())}
													</span>
                                                    {currentEvent.data.durationMs && (
                                                        <span className="text-muted-foreground text-xs">{`${currentEvent.data.durationMs}ms`}</span>
                                                    )}
												</div>
											</ChainOfThoughtStep>
										);

									default:
										return (
											<Task key={index} defaultOpen={false}>
                                                <TaskTrigger title={`${currentEvent.type} Event`}>
													<div className="flex items-center gap-2">
														<Badge variant="outline" className="text-xs">
                                                            {currentEvent.type}
														</Badge>
														<span className="text-muted-foreground text-xs">
                                                            {new Date(
                                                                currentEvent.data.timestamp || Date.now(),
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
						</ChainOfThoughtContent>
					</ChainOfThought>
				</ScrollArea>
			</CardContent>
		</Card>
	);
}
