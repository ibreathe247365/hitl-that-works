import { api } from "@hitl/backend/convex/_generated/api";
import { db } from "./db";
import type { Event, Thread } from "./schemas";

export function addThreadEvent(
	stateId: string,
	event: Event,
	initialEmail?: any,
	userId?: string,
) {
	db.mutation(api.threads.addEvent, {
		stateId,
		type: event.type,
		data: event.data,
		initialEmail,
		userId,
	}).catch((err: any) => console.error("Convex addEvent failed:", err));
}

export function syncLatestEventToConvex(
	stateId: string,
	thread: Thread,
	userId?: string,
) {
	if (thread.events.length > 0) {
		const latestEvent = thread.events[thread.events.length - 1];
		if (latestEvent) {
			addThreadEvent(stateId, latestEvent, thread.initial_email, userId);
		}
	}
}
