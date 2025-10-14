import { api } from "@hitl/backend/convex/_generated/api";
import { db } from "./db";
import type { Event, Thread } from "./schemas";

function nowIso(): string {
    return new Date().toISOString();
}

function generateOperationId(): string {
    return `operation_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

interface QueueOrStartOptions {
	payload?: any;
	parentOperationId?: string;
	source?: string;
	operationId?: string;
}

interface CompleteOptions {
	name?: string;
	parentOperationId?: string;
	source?: string;
	startedAt?: string;
}

interface SucceedOptions extends CompleteOptions {
	result?: any;
}

interface FailOptions extends CompleteOptions {}

function normalizeError(error: unknown): { message: string; stack?: string; code?: string } {
	if (error instanceof Error) return { message: error.message, stack: error.stack };
	if (typeof error === "string") return { message: error };
	try {
		return { message: JSON.stringify(error) };
	} catch {
		return { message: "Unknown error" };
	}
}

function updateOrAppendEvent(
	stateId: string,
	eventType: string,
	operationId: string,
	patchData: Record<string, any>,
	fallbackData: Record<string, any>,
): void {
	db.mutation(api.threads.updateEvent, {
		stateId,
		operationId,
		patch: patchData,
	})
		.then((response: any) => {
			if (!response?.updated) {
				addThreadEvent(stateId, { type: eventType, data: fallbackData } as Event);
			}
		})
		.catch((_error: any) => {
			addThreadEvent(stateId, { type: eventType, data: fallbackData } as Event);
		});
}

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
	if (thread.events && thread.events.length > 0) {
		const latestEvent = thread.events[thread.events.length - 1];
		if (latestEvent) {
			addThreadEvent(stateId, latestEvent, thread.initial_email, userId);
		}
	}
}

export function queueOperation(
    stateId: string,
    type: string,
    name: string,
    options?: QueueOrStartOptions,
): string {
    const operationId = options?.operationId || generateOperationId();
    addThreadEvent(stateId, {
        type,
        data: {
            name,
            status: "queued",
            operationId,
            parentOperationId: options?.parentOperationId,
            startedAt: nowIso(),
            payload: options?.payload,
            source: options?.source,
        },
    } as Event);
    return operationId;
}

export function startOperation(
    stateId: string,
    type: string,
    name: string,
    options?: QueueOrStartOptions,
): string {
    const operationId = options?.operationId || generateOperationId();
    addThreadEvent(stateId, {
        type,
        data: {
            name,
            status: "in_progress",
            operationId,
            parentOperationId: options?.parentOperationId,
            startedAt: nowIso(),
            payload: options?.payload,
            source: options?.source,
        },
    } as Event);
    return operationId;
}

export function succeedOperation(
    stateId: string,
    type: string,
    operationId: string,
    options?: SucceedOptions,
): void {
    const endedAt = nowIso();
    const startedAt = options?.startedAt;
    const durationMs = startedAt ? Date.parse(endedAt) - Date.parse(startedAt) : undefined;

	const patchData = {
		name: options?.name,
		status: "succeeded",
		operationId,
		parentOperationId: options?.parentOperationId,
		endedAt,
		startedAt,
		durationMs,
		result: options?.result,
		source: options?.source,
	};

	const fallbackData = { ...patchData };

	updateOrAppendEvent(stateId, type, operationId, patchData, fallbackData);
}

export function failOperation(
    stateId: string,
    type: string,
    operationId: string,
    error: unknown,
    options?: FailOptions,
): void {
    const endedAt = nowIso();
    const startedAt = options?.startedAt;
    const durationMs = startedAt ? Date.parse(endedAt) - Date.parse(startedAt) : undefined;

	const normalizedError = normalizeError(error);

	const patchData = {
		name: options?.name,
		status: "failed",
		operationId,
		parentOperationId: options?.parentOperationId,
		endedAt,
		startedAt,
		durationMs,
		error: normalizedError,
		source: options?.source,
	};

	const fallbackData = { ...patchData };

	updateOrAppendEvent(stateId, type, operationId, patchData, fallbackData);
}
