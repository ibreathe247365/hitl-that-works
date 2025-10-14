"use client";

import type { ReactElement } from "react";
import type { Event } from "@hitl/ai/schemas";
import { Badge } from "@/components/ui/badge";
import { ChainOfThoughtStep } from "@/components/ai-elements/chain-of-thought";
import { formatRelativeTime } from "../utils";

export function WebhookProcessedContent({ event }: { event: Event }): ReactElement {
	return (
		<div className="flex items-center gap-2">
			<Badge variant="secondary" className="text-xs">{(event.data as any).payloadType}</Badge>
			<span className="text-muted-foreground text-xs">{formatRelativeTime((event.data as any).timestamp || Date.now())}</span>
			{(event.data as any).durationMs && <span className="text-muted-foreground text-xs">{`${(event.data as any).durationMs}ms`}</span>}
		</div>
	);
}

export function WebhookProcessedStep({ event }: { event: Event }): ReactElement {
	return (
		<ChainOfThoughtStep
			label="Webhook Processed"
			description={`${(event.data as any).payloadType} event processed`}
			status={
				((event.data as any).status === "in_progress" && "active") ||
				((event.data as any).status === "succeeded" && "complete") ||
				((event.data as any).status === "failed" && "complete") ||
				"pending"
			}
		>
			<WebhookProcessedContent event={event} />
		</ChainOfThoughtStep>
	);
}
