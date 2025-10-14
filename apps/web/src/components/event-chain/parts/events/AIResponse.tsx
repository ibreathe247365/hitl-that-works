"use client";

import type { Event } from "@hitl/ai/schemas";
import { ClockIcon } from "lucide-react";
import type { ReactElement } from "react";
import { ChainOfThoughtStep } from "@/components/ai-elements/chain-of-thought";
import { formatRelativeTime } from "../utils";

export function AIResponseContent({ event }: { event: Event }): ReactElement {
	return (
		<div className="space-y-3">
			<div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800/30 dark:bg-green-950/20">
				<p className="text-sm leading-relaxed">
					{(event.data as any).message || (event.data as any).text}
				</p>
			</div>
			{(event.data as any).timestamp && (
				<div className="flex items-center gap-1 text-muted-foreground text-xs">
					<ClockIcon className="h-3 w-3" />
					{formatRelativeTime((event.data as any).timestamp)}
				</div>
			)}
		</div>
	);
}

export function AIResponseStep({ event }: { event: Event }): ReactElement {
	return (
		<ChainOfThoughtStep
			label="AI Response"
			description="Assistant response generated"
			status="complete"
		>
			<AIResponseContent event={event} />
		</ChainOfThoughtStep>
	);
}
