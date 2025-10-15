"use client";

import type { Event } from "@hitl/ai/schemas";
import type { ReactElement } from "react";
import {
	ChainOfThought,
	ChainOfThoughtContent,
	ChainOfThoughtHeader,
	ChainOfThoughtStep,
} from "@/components/ai-elements/chain-of-thought";
import { Badge } from "@/components/ui/badge";

export function CalculateIntentContent({
	event,
}: {
	event: Event;
}): ReactElement {
	const data = (event.data as any) ?? {};
	return (
		<ChainOfThought defaultOpen={true}>
			<ChainOfThoughtHeader>
				<Badge variant="secondary">Calculate</Badge>
			</ChainOfThoughtHeader>
			<ChainOfThoughtContent>
				{data.expression && (
					<ChainOfThoughtStep label="Expression">
						<p className="text-sm">{String(data.expression)}</p>
					</ChainOfThoughtStep>
				)}
				{data.explanation && (
					<ChainOfThoughtStep label="Explanation">
						<p className="text-sm">{String(data.explanation)}</p>
					</ChainOfThoughtStep>
				)}
			</ChainOfThoughtContent>
		</ChainOfThought>
	);
}

export function DoneForNowIntentContent({
	event,
}: {
	event: Event;
}): ReactElement {
	const data = (event.data as any) ?? {};
	return (
		<div className="space-y-2">
			<div className="flex items-center gap-2">
				<h4 className="font-medium text-sm">AI Decision</h4>
				<Badge variant="secondary">Done For Now</Badge>
			</div>
			{data.message && (
				<div className="rounded-lg border bg-muted/40 p-3 text-sm">
					{String(data.message)}
				</div>
			)}
		</div>
	);
}

export function NothingToDoIntentContent({
	event,
}: {
	event: Event;
}): ReactElement {
	const data = (event.data as any) ?? {};
	return (
		<div className="space-y-2">
			<div className="flex items-center gap-2">
				<h4 className="font-medium text-sm">AI Analysis</h4>
				<Badge variant="outline">Nothing To Do</Badge>
			</div>
			{data.message && (
				<p className="text-muted-foreground text-sm">{String(data.message)}</p>
			)}
		</div>
	);
}

export function CalculateIntentStep({ event }: { event: Event }): ReactElement {
	return (
		<ChainOfThoughtStep label="Intent" description="Calculate">
			<CalculateIntentContent event={event} />
		</ChainOfThoughtStep>
	);
}

export function DoneForNowIntentStep({
	event,
}: {
	event: Event;
}): ReactElement {
	return (
		<ChainOfThoughtStep label="Intent" description="Done For Now">
			<DoneForNowIntentContent event={event} />
		</ChainOfThoughtStep>
	);
}

export function NothingToDoIntentStep({
	event,
}: {
	event: Event;
}): ReactElement {
	return (
		<ChainOfThoughtStep label="Intent" description="Nothing To Do">
			<NothingToDoIntentContent event={event} />
		</ChainOfThoughtStep>
	);
}
