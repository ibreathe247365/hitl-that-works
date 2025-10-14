import type { Event } from "@hitl/ai/schemas";
import { formatDistanceToNow } from "date-fns";

export function formatRelativeTime(timestamp?: string | number | Date) {
	if (!timestamp) return null;
	return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
}

export function buildOperationGraph(events: Event[]) {
	const eventIndex = new WeakMap<Event, number>();
	for (let i = 0; i < events.length; i++) {
		eventIndex.set(events[i], i);
	}

	const operationIdToEvent = new Map<string, Event>();
	const operationIdToChildren = new Map<string, Event[]>();
	const eventsWithOperationId: Event[] = [];

	for (const currentEvent of events) {
		const operationId = (currentEvent.data as any)?.operationId as
			| string
			| undefined;
		if (operationId) {
			operationIdToEvent.set(operationId, currentEvent);
			eventsWithOperationId.push(currentEvent);
		}
	}

	for (const currentEvent of eventsWithOperationId) {
		const parentOperationId = (currentEvent.data as any)?.parentOperationId as
			| string
			| undefined;
		if (parentOperationId) {
			if (!operationIdToChildren.has(parentOperationId))
				operationIdToChildren.set(parentOperationId, []);
			operationIdToChildren.get(parentOperationId)!.push(currentEvent);
		}
	}

	const rootOperationEvents: Event[] = [];
	for (const currentEvent of eventsWithOperationId) {
		const parentOperationId = (currentEvent.data as any)?.parentOperationId as
			| string
			| undefined;
		if (!parentOperationId || !operationIdToEvent.has(parentOperationId)) {
			rootOperationEvents.push(currentEvent);
		}
	}

	const nonOperationEvents = events.filter(
		(e) => !(e.data as any)?.operationId,
	);

	return {
		eventIndex,
		operationIdToChildren,
		rootOperationEvents,
		nonOperationEvents,
	} as const;
}

export function getEventLabel(currentEvent: Event) {
	switch (currentEvent.type) {
		case "human_response":
			return "Human Response";
		case "request_more_information":
			return "Request More Information";
		case "user_message":
			return "User Message";
		case "tool_call":
		case "function_call":
			return (
				(currentEvent.data as any).name ||
				(currentEvent.data as any).function_name ||
				"Tool Call"
			);
		case "ai_response":
		case "assistant_message":
			return "AI Response";
		case "webhook_processed":
			return "Webhook Processed";
		case "ai_step":
			return "AI Step";
		case "queue":
			return "Queue";
		case "webhook_received":
			return "Webhook Received";
		case "webhook":
			return "Webhook";
		default:
			return `${currentEvent.type} Event`;
	}
}

export function getEventStatusColor(currentEvent: Event) {
	switch (currentEvent.type) {
		case "human_response":
		case "request_more_information":
			return "bg-yellow-500";
		case "user_message":
			return "bg-blue-500";
		case "tool_call":
		case "function_call":
			return "bg-purple-500";
		case "ai_response":
		case "assistant_message":
			return "bg-green-500";
		case "webhook_processed":
		case "webhook_received":
		case "webhook":
			return "bg-teal-500";
		case "ai_step":
			return "bg-indigo-500";
		case "queue":
			return "bg-gray-500";
		default:
			return "bg-muted-foreground/40";
	}
}

export function getEventStatusBlinkClass(currentEvent: Event) {
	const colorClass = getEventStatusColor(currentEvent);
	return colorClass === "bg-gray-500" || colorClass === "bg-muted-foreground/40"
		? ""
		: "animate-pulse";
}
