"use client";

import type { Event } from "@hitl/ai/schemas";
import { ClockIcon } from "lucide-react";
import type { ReactElement } from "react";
import { ChainOfThoughtStep } from "@/components/ai-elements/chain-of-thought";
import { formatRelativeTime } from "../utils";

export function UserMessageContent({ event }: { event: Event }): ReactElement {
	return (
		<div className="space-y-3">
			<div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800/30 dark:bg-blue-950/20">
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

export function UserMessageStep({ event }: { event: Event }): ReactElement {
	return (
		<ChainOfThoughtStep
			label="User Message"
			description="User input received"
			status="complete"
		>
			<UserMessageContent event={event} />
		</ChainOfThoughtStep>
	);
}
