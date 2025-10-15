"use client";

import type { Event } from "@hitl/ai/schemas";
import { BrainIcon } from "lucide-react";
import {
	ChainOfThought,
	ChainOfThoughtContent,
	ChainOfThoughtHeader,
} from "@/components/ai-elements/chain-of-thought";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EventContentStepList } from "./parts/EventContentStepList";

interface EventChainProps {
	events: Event[];
}

export function EventChain({ events }: EventChainProps) {
    const eventsSortedByTime = [...events].sort((a, b) => {
        const aTs = Number(new Date(((a.data as any)?.timestamp) ?? 0));
        const bTs = Number(new Date(((b.data as any)?.timestamp) ?? 0));
        return aTs - bTs;
    });

	if (events.length === 0) {
		return (
			<Card className="h-full">
				<CardHeader className="pb-4">
					<CardTitle className="flex items-center gap-2 text-lg">
						<BrainIcon className="h-5 w-5 text-primary" />
						Event Chain
					</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-1 items-center justify-center">
					<div className="mx-auto max-w-sm py-12 text-center">
						<div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
							<BrainIcon className="h-8 w-8 text-muted-foreground" />
						</div>
						<h3 className="mb-2 font-semibold text-lg">No events yet</h3>
						<p className="mb-4 text-muted-foreground">
							Send a message to start the conversation and see AI processing
							events here.
						</p>
						<div className="rounded-lg border border-dashed bg-muted/50 p-4">
							<p className="text-muted-foreground text-sm">
								Events will appear here as the AI processes your requests and
								performs actions.
							</p>
						</div>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="h-full">
			<CardContent className="min-h-0 flex-1 p-0">
				<ScrollArea className="h-full px-6 pb-6">
					<ChainOfThought defaultOpen={true}>
						<ChainOfThoughtHeader>Event Chain</ChainOfThoughtHeader>
						<ChainOfThoughtContent>
                            <EventContentStepList events={eventsSortedByTime} />
						</ChainOfThoughtContent>
					</ChainOfThought>
				</ScrollArea>
			</CardContent>
		</Card>
	);
}

export default EventChain;
