"use client";

import type { Event } from "@hitl/ai/schemas";
import { HelpCircle } from "lucide-react";
import type { ReactElement } from "react";
import { ChainOfThoughtStep } from "@/components/ai-elements/chain-of-thought";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

export function RequestMoreInformationContent({
	event,
}: {
	event: Event;
}): ReactElement {
	const intent = (event.data as any)?.intent;
	const message = (event.data as any)?.message ?? (event.data as any)?.prompt;
	return (
		<div className="space-y-2">
			<div className="flex items-center gap-2">
				{intent && <Badge variant="secondary">{String(intent)}</Badge>}
			</div>
			<Alert>
				<HelpCircle className="h-4 w-4" />
				<AlertDescription>
					{String(message ?? "More information required")}
				</AlertDescription>
			</Alert>
		</div>
	);
}

export function RequestMoreInformationStep({
	event,
}: {
	event: Event;
}): ReactElement {
	return (
		<ChainOfThoughtStep
			label="Request More Information"
			description="Assistant needs clarification"
			status="complete"
		>
			<RequestMoreInformationContent event={event} />
		</ChainOfThoughtStep>
	);
}
