import type { Event } from "@hitl/ai/schemas";

// Extract all possible event types from the Event union type
export type EventType = Event["type"];

// Type-safe event type filter with index signature for dynamic access
export type EventTypeFilter = {
	[key: string]: boolean | undefined;
} & Partial<Record<EventType, boolean>>;
