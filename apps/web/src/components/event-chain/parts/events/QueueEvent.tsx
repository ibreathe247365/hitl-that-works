"use client";

import type { Event } from "@hitl/ai/schemas";
import type { ReactElement } from "react";
import { ChainOfThoughtStep } from "@/components/ai-elements/chain-of-thought";
import { Badge } from "@/components/ui/badge";
import { getOperationStatusColorClass } from "../utils";

export function QueueEventContent({ event }: { event: Event }): ReactElement {
	const data = (event.data as any) ?? {};
	const isSucceeded = data.status === "succeeded";
	const isFailed = data.status === "failed";
	return (
		<div className="space-y-3">
			<div className="flex items-center gap-2">
				<h4 className="font-medium text-sm">
					{String(data.name ?? "Queue Event")}
				</h4>
				{data.status && (
					<Badge className={getOperationStatusColorClass(data.status)}>
						{String(data.status)}
					</Badge>
				)}
				{typeof data.durationMs === "number" && (
					<span className="text-muted-foreground text-xs">
						{data.durationMs}ms
					</span>
				)}
			</div>
			{data.operationId && (
				<div className="text-xs">
					<span className="text-muted-foreground">Operation: </span>
					<code className="rounded bg-muted/50 px-2 py-0.5">
						{String(data.operationId)}
					</code>
				</div>
			)}
			{data.payload?.event?.status?.response && (
				<div className="rounded-lg border bg-primary/5 p-3 text-sm">
					<p className="mb-1 text-muted-foreground">User Query</p>
					<p className="text-primary">
						{String(data.payload.event.status.response)}
					</p>
				</div>
			)}
			{data.payload?.event?.state?.stateId && (
				<div className="text-xs">
					<span className="text-muted-foreground">State: </span>
					<code className="rounded bg-muted/50 px-2 py-0.5">
						{String(data.payload.event.state.stateId)}
					</code>
				</div>
			)}
			{data.result && (
				<div className="rounded-lg border bg-accent/30 p-3">
					<p className="mb-2 text-muted-foreground text-sm">Result</p>
					{typeof data.result === "object" && data.result?.ok !== undefined ? (
						<div className="text-sm">Operation completed successfully</div>
					) : (
						<pre className="overflow-x-auto rounded bg-muted p-2 text-xs">
							{JSON.stringify(data.result, null, 2)}
						</pre>
					)}
				</div>
			)}
		</div>
	);
}

export function QueueEventStep({ event }: { event: Event }): ReactElement {
	return (
		<ChainOfThoughtStep
			label="Queue"
			description="Queued work processed"
			status="complete"
		>
			<QueueEventContent event={event} />
		</ChainOfThoughtStep>
	);
}
