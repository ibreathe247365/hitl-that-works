"use client";

import type { Event } from "@hitl/ai/schemas";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import type { ReactElement } from "react";
import {
	ChainOfThought,
	ChainOfThoughtContent,
	ChainOfThoughtHeader,
	ChainOfThoughtStep,
} from "@/components/ai-elements/chain-of-thought";
import { Badge } from "@/components/ui/badge";

type AIStepIntent = "nothing_to_do" | "calculate" | "done_for_now";

interface AIStepPayloadBase {
	intent: AIStepIntent;
	message?: string;
}

interface AIStepCalculatePayload extends AIStepPayloadBase {
	intent: "calculate";
	expression?: string;
	explanation?: string;
}

type AIStepPayload = AIStepPayloadBase | AIStepCalculatePayload;

interface AIStepResult {
	formatted?: string;
}

interface AIStepDataShape {
	payload?: AIStepPayload;
	result?: AIStepResult;
}

function isAIStepEvent(current: Event): boolean {
	return current.type === "ai_step";
}

export function AIStepContent({
	event,
}: {
	event: Event;
}): ReactElement | null {
	if (!isAIStepEvent(event)) return null;
	const data = event.data as unknown as AIStepDataShape;
	const payload = data?.payload ?? ({} as AIStepPayload);

	if (payload.intent === "nothing_to_do") {
		return (
			<div className="space-y-2">
				<div className="flex items-center gap-2">
					<AlertCircle className="h-4 w-4" />
					<h4 className="font-medium text-sm">AI Analysis</h4>
					<Badge variant="outline">No Action</Badge>
				</div>
				<p className="text-muted-foreground text-sm">
					{payload.message ?? "No action required."}
				</p>
			</div>
		);
	}

	if (payload.intent === "calculate") {
		const calc = payload as AIStepCalculatePayload;
		return (
			<ChainOfThought defaultOpen={true}>
				<ChainOfThoughtHeader>
					<Badge variant="secondary">Calculate</Badge>
				</ChainOfThoughtHeader>
				<ChainOfThoughtContent>
					{calc.expression && (
						<ChainOfThoughtStep label="Expression">
							<p className="text-sm">{calc.expression}</p>
						</ChainOfThoughtStep>
					)}
					{calc.explanation && (
						<ChainOfThoughtStep label="Explanation">
							<p className="text-sm">{calc.explanation}</p>
						</ChainOfThoughtStep>
					)}
					{data?.result?.formatted && (
						<ChainOfThoughtStep label="Result">
							<p className="text-primary text-sm">{data.result.formatted}</p>
						</ChainOfThoughtStep>
					)}
				</ChainOfThoughtContent>
			</ChainOfThought>
		);
	}

	if (payload.intent === "done_for_now") {
		return (
			<div className="space-y-2">
				<div className="flex items-center gap-2">
					<CheckCircle2 className="h-4 w-4" />
					<h4 className="font-medium text-sm">AI Decision</h4>
					<Badge variant="secondary">Task Complete</Badge>
				</div>
				<p className="text-muted-foreground text-sm">
					{payload.message ?? "Done for now."}
				</p>
			</div>
		);
	}

	return null;
}

export function AIStepStep({ event }: { event: Event }): ReactElement {
	return (
		<ChainOfThoughtStep
			label="AI Step"
			description="Reasoning step"
			status="complete"
		>
			<AIStepContent event={event} />
		</ChainOfThoughtStep>
	);
}
