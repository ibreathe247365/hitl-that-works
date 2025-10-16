"use client";

import type { Event } from "@hitl/ai/schemas";
import { BrainIcon } from "lucide-react";
import { useEffect, useState } from "react";
import {
	ChainOfThought,
	ChainOfThoughtContent,
	ChainOfThoughtHeader,
} from "@/components/ai-elements/chain-of-thought";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ALL_EVENT_TYPES, EventFilter } from "./EventFilter";
import { EventContentStepList } from "./parts/EventContentStepList";
import type { EventTypeFilter } from "./types";

interface EventChainProps {
	events: Event[];
}

export function EventChain({ events }: EventChainProps) {
	const [visibleEventTypes, setVisibleEventTypes] = useState<EventTypeFilter>(
		() => {
			const defaultFilters: EventTypeFilter = {};
			ALL_EVENT_TYPES.forEach((eventType) => {
				defaultFilters[eventType] = true;
			});
			return defaultFilters;
		},
	);

	useEffect(() => {
		const savedFilters = localStorage.getItem("event-chain-filters");
		if (savedFilters) {
			try {
				const parsedFilters = JSON.parse(savedFilters);
				setVisibleEventTypes(parsedFilters);
			} catch (error) {
				console.warn("Failed to parse saved event filters:", error);
			}
		}
	}, []);

	useEffect(() => {
		localStorage.setItem(
			"event-chain-filters",
			JSON.stringify(visibleEventTypes),
		);
	}, [visibleEventTypes]);

	const eventsSortedByTime = [...events].sort((a, b) => {
		const aTs = Number(new Date((a.data as any)?.timestamp ?? 0));
		const bTs = Number(new Date((b.data as any)?.timestamp ?? 0));
		return aTs - bTs;
	});

	const filteredEvents = eventsSortedByTime.filter(
		(event) => visibleEventTypes[event.type] !== false,
	);

	if (events.length === 0) {
		return (
			<Card className="h-full">
				<CardHeader className="pb-4">
					<CardTitle className="flex items-center justify-between text-lg">
						<div className="flex items-center gap-2">
							<BrainIcon className="h-5 w-5 text-primary" />
							Event Chain
						</div>
						<EventFilter
							visibleEventTypes={visibleEventTypes}
							onFilterChange={setVisibleEventTypes}
						/>
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
			<CardHeader className="pb-4">
				<CardTitle className="flex items-center justify-between text-lg">
					<div className="flex items-center gap-2">
						<BrainIcon className="h-5 w-5 text-primary" />
						Event Chain
					</div>
					<EventFilter
						visibleEventTypes={visibleEventTypes}
						onFilterChange={setVisibleEventTypes}
					/>
				</CardTitle>
			</CardHeader>
			<CardContent className="min-h-0 flex-1 p-0">
				<ScrollArea className="h-full px-6 pb-6">
					<ChainOfThought defaultOpen={true}>
						<ChainOfThoughtHeader>Event Chain</ChainOfThoughtHeader>
						<ChainOfThoughtContent>
							<EventContentStepList events={filteredEvents} />
						</ChainOfThoughtContent>
					</ChainOfThought>
				</ScrollArea>
			</CardContent>
		</Card>
	);
}

export default EventChain;
