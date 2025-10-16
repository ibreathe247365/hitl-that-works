import type { Event } from "@hitl/ai/schemas";

// Extract all possible event types from the Event union type
export type EventType = Event['type'];

// Type-safe event type filter with index signature for dynamic access
export interface EventTypeFilter {
	[K in EventType]?: boolean;
	[key: string]: boolean | undefined;
}