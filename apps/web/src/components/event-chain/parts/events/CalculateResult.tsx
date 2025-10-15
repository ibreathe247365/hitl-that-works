"use client";

import type { Event } from "@hitl/ai/schemas";
import type { ReactElement } from "react";
import { ChainOfThoughtStep } from "@/components/ai-elements/chain-of-thought";

export function CalculateResultContent({
	event,
}: {
	event: Event;
}): ReactElement {
	const data = (event.data as any) ?? {};
	return (
		<div className="space-y-2 text-sm">
			{data.formatted && (
				<div className="rounded-lg border bg-accent/30 p-3">
					<p className="font-mono text-primary">{String(data.formatted)}</p>
				</div>
			)}
			{Array.isArray(data.steps) && data.steps.length > 0 && (
				<div>
					<p className="mb-1 text-muted-foreground">Steps</p>
					<ul className="list-disc pl-5">
						{data.steps.map((s: any, i: number) => (
							<li key={i} className="font-mono text-xs">
								{String(s)}
							</li>
						))}
					</ul>
				</div>
			)}
		</div>
	);
}

export function CalculateResultStep({ event }: { event: Event }): ReactElement {
	return (
		<ChainOfThoughtStep
			label="Result"
			description="Calculation Result"
			status="complete"
		>
			<CalculateResultContent event={event} />
		</ChainOfThoughtStep>
	);
}
