"use client";

import type { Event } from "@hitl/ai/schemas";
import type { ReactElement } from "react";
import { ChainOfThoughtStep } from "@/components/ai-elements/chain-of-thought";
import { Badge } from "@/components/ui/badge";

export function WebhookReceivedContent({
	event,
}: {
	event: Event;
}): ReactElement {
	const data = (event.data as any) ?? {};
	return (
		<div className="space-y-2">
			<div className="flex items-center gap-2">
				<h4 className="font-medium text-sm">Webhook Received</h4>
				{data.source && <Badge variant="outline">{String(data.source)}</Badge>}
			</div>
			<div className="space-y-1 text-xs">
				{data.payloadType && (
					<div>
						<span className="text-muted-foreground">Type: </span>
						<span>{String(data.payloadType)}</span>
					</div>
				)}
				{data.jobId && (
					<div>
						<span className="text-muted-foreground">Job ID: </span>
						<code className="rounded bg-muted/50 px-2 py-0.5">
							{String(data.jobId)}
						</code>
					</div>
				)}
			</div>
		</div>
	);
}

export function WebhookOperationContent({
	event,
}: {
	event: Event;
}): ReactElement {
	const data = (event.data as any) ?? {};
	const status: string | undefined = data.status;
	return (
		<div className="space-y-3">
			<div className="flex items-center gap-2">
				<h4 className="font-medium text-sm">
					{String(data.name ?? "Webhook Operation")}
				</h4>
				{status && (
					<Badge
						variant={
							status === "succeeded"
								? "default"
								: status === "failed"
									? "destructive"
									: "secondary"
						}
					>
						{status}
					</Badge>
				)}
				{typeof data.durationMs === "number" && (
					<span className="text-muted-foreground text-xs">
						{data.durationMs}ms
					</span>
				)}
			</div>
			{data.payload && (
				<div className="space-y-1 text-xs">
					{data.payload.jobId && (
						<div>
							<span className="text-muted-foreground">Job ID: </span>
							<code className="rounded bg-muted/50 px-2 py-0.5">
								{String(data.payload.jobId)}
							</code>
						</div>
					)}
					{data.payload.payloadType && (
						<div>
							<span className="text-muted-foreground">Type: </span>
							<Badge variant="outline">
								{String(data.payload.payloadType)}
							</Badge>
						</div>
					)}
					{data.payload.source && (
						<div>
							<span className="text-muted-foreground">Source: </span>
							<span>{String(data.payload.source)}</span>
						</div>
					)}
				</div>
			)}
		</div>
	);
}

export function WebhookReceivedStep({ event }: { event: Event }): ReactElement {
	return (
		<ChainOfThoughtStep
			label="Webhook Received"
			description="Inbound webhook accepted"
			status="complete"
		>
			<WebhookReceivedContent event={event} />
		</ChainOfThoughtStep>
	);
}

export function WebhookOperationStep({
	event,
}: {
	event: Event;
}): ReactElement {
	const status: string | undefined = (event.data as any)?.status;
	return (
		<ChainOfThoughtStep
			label="Webhook"
			description="Webhook operation"
			status={
				(status === "in_progress" && "active") ||
				(status ? "complete" : "pending")
			}
		>
			<WebhookOperationContent event={event} />
		</ChainOfThoughtStep>
	);
}
