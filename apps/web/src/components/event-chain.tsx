"use client";

import type { Event } from "@hitl/ai/schemas";
import { BrainIcon, ClockIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
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
				<CardHeader className="pb-4">
					<CardTitle className="flex items-center gap-2 text-lg">
						<BrainIcon className="h-5 w-5 text-primary" />
						Event Chain
					</CardTitle>
				</CardHeader>
				<CardContent className="flex-1 flex items-center justify-center">
					<div className="py-12 text-center max-w-sm mx-auto">
						<div className="mx-auto mb-6 h-16 w-16 rounded-full bg-muted flex items-center justify-center">
							<BrainIcon className="h-8 w-8 text-muted-foreground" />
						</div>
						<h3 className="font-semibold text-lg mb-2">No events yet</h3>
						<p className="text-muted-foreground mb-4">
							Send a message to start the conversation and see AI processing events here.
						</p>
						<div className="rounded-lg bg-muted/50 p-4 border border-dashed">
							<p className="text-muted-foreground text-sm">
								Events will appear here as the AI processes your requests and performs actions.
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
			<CardContent className="p-0 flex-1 min-h-0">
				<ScrollArea className="h-full px-6 pb-6">
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
												<div className="space-y-3">
													<div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/30">
														<p className="text-sm leading-relaxed">
															{event.data.message || event.data.text}
														</p>
													</div>
													{event.data.timestamp && (
														<div className="text-muted-foreground text-xs flex items-center gap-1">
															<ClockIcon className="h-3 w-3" />
															{formatDistanceToNow(new Date(event.data.timestamp), { addSuffix: true })}
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
												<div className="space-y-3">
													<div className="rounded-lg bg-green-50 p-4 dark:bg-green-950/20 border border-green-200 dark:border-green-800/30">
														<p className="text-sm leading-relaxed">
															{event.data.message || event.data.text}
														</p>
													</div>
													{event.data.timestamp && (
														<div className="text-muted-foreground text-xs flex items-center gap-1">
															<ClockIcon className="h-3 w-3" />
															{formatDistanceToNow(new Date(event.data.timestamp), { addSuffix: true })}
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
												description={`${event.data.payloadType} event processed`}
												status="complete"
											>
												<div className="flex items-center gap-2">
													<Badge variant="secondary" className="text-xs">
														{event.data.payloadType}
													</Badge>
													<span className="text-muted-foreground text-xs">
														{formatDistanceToNow(new Date(event.data.timestamp || Date.now()), { addSuffix: true })}
													</span>
												</div>
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
														<pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs border">
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
