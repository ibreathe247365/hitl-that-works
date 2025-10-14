"use client";

import type { Event } from "@hitl/ai/schemas";
import { ClockIcon } from "lucide-react";
import type { ReactElement } from "react";
import { ChainOfThoughtStep } from "@/components/ai-elements/chain-of-thought";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "../utils";

export function HumanResponseContent({
	event,
}: {
	event: Event;
}): ReactElement {
	const response =
		(event.data as any)?.data ??
		(event.data as any)?.message ??
		(event.data as any)?.text;
	const timestamp = (event.data as any)?.timestamp;
	return (
		<div className="space-y-3">
			<div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800/30 dark:bg-slate-950/20">
				<p className="text-sm leading-relaxed">{String(response ?? "")}</p>
			</div>
			{timestamp && (
				<div className="flex items-center gap-2 text-muted-foreground text-xs">
					<Badge variant="secondary">User Input</Badge>
					<ClockIcon className="h-3 w-3" />
					{formatRelativeTime(timestamp)}
				</div>
			)}
		</div>
	);
}

export function HumanResponseStep({ event }: { event: Event }): ReactElement {
	return (
		<ChainOfThoughtStep
			label="Human Response"
			description="User provided additional information"
			status="complete"
		>
			<HumanResponseContent event={event} />
		</ChainOfThoughtStep>
	);
}
