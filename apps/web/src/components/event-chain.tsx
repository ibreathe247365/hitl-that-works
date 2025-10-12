"use client";

import type { Event } from "@hitl/ai/schemas";
import { BrainIcon } from "lucide-react";
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
	if (events.length === 0) {
		return (
			<Card className="h-full">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<BrainIcon className="h-5 w-5" />
						Event Chain
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="py-8 text-center text-muted-foreground">
						No events yet. Send a message to start the conversation.
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="h-full">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<BrainIcon className="h-5 w-5" />
					Event Chain
				</CardTitle>
			</CardHeader>
			<CardContent className="p-0">
				<ScrollArea className="h-[calc(100vh-200px)] p-4">
					<ChainOfThought defaultOpen={true}>
						<ChainOfThoughtHeader>AI Processing Chain</ChainOfThoughtHeader>
						<ChainOfThoughtContent>
							{events.map((event, index) => {
								switch (event.type) {
									case "user_message":
										return (
											<ChainOfThoughtStep
												key={index}
												label="User Message"
												description="User input received"
												status="complete"
											>
												<div className="rounded-md bg-muted p-3">
													<p className="text-sm">
														{event.data.message || event.data.text}
													</p>
												</div>
											</ChainOfThoughtStep>
										);

									case "tool_call":
									case "function_call":
										return (
											<Tool key={index} defaultOpen={false}>
												<ToolHeader
													title={event.data.name || event.data.function_name}
													type={`tool-${event.type}` as const}
													state="output-available"
												/>
												<ToolContent>
													<ToolInput
														input={event.data.arguments || event.data.input}
													/>
													<ToolOutput
														output={event.data.result || event.data.output}
														errorText={event.data.error}
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
												<div className="rounded-md bg-muted p-3">
													<p className="text-sm">
														{event.data.message || event.data.text}
													</p>
												</div>
											</ChainOfThoughtStep>
										);

									case "webhook_processed":
										return (
											<ChainOfThoughtStep
												key={index}
												label="Webhook Processed"
												description={`${event.data.payloadType} event processed`}
												status="complete"
											>
												<Badge variant="secondary" className="text-xs">
													{event.data.payloadType}
												</Badge>
											</ChainOfThoughtStep>
										);

									default:
										return (
											<Task key={index} defaultOpen={false}>
												<TaskTrigger title={`${event.type} Event`}>
													<div className="flex items-center gap-2">
														<Badge variant="outline" className="text-xs">
															{event.type}
														</Badge>
														<span className="text-muted-foreground text-xs">
															{new Date(
																event.data.timestamp || Date.now(),
															).toLocaleTimeString()}
														</span>
													</div>
												</TaskTrigger>
												<TaskContent>
													<TaskItem>
														<pre className="overflow-x-auto rounded bg-muted p-2 text-xs">
															{JSON.stringify(event.data, null, 2)}
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
