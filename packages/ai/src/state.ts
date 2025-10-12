import { Redis } from "@upstash/redis";
import type { Thread } from "./schemas";
import { syncLatestEventToConvex } from "./sync";

const redis = new Redis({
	url: process.env.UPSTASH_REDIS_REST_URL,
	token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export interface ThreadStateWithMetadata {
	thread: Thread;
	metadata?: {
		jobId?: string;
		enqueuedAt?: string;
		processingAttempts?: number;
		lastProcessedAt?: string;
	};
}

export async function saveThreadState(
	thread: Thread,
	metadata?: ThreadStateWithMetadata["metadata"],
	userId?: string,
): Promise<string> {
	const stateId = `thread_${Date.now()}_${Math.random().toString(36).substring(7)}`;

	const stateWithMetadata: ThreadStateWithMetadata = {
		thread,
		metadata: {
			...metadata,
			lastProcessedAt: new Date().toISOString(),
		},
	};

	await redis.set(stateId, JSON.stringify(stateWithMetadata));

	syncLatestEventToConvex(stateId, thread, userId);
	return stateId;
}

export async function getThreadState(stateId: string): Promise<Thread | null> {
	const state = await redis.get<string>(stateId);
	if (!state) return null;

	try {
		const parsed: ThreadStateWithMetadata = JSON.parse(state);
		return parsed.thread;
	} catch (error) {
		console.error(`Failed to parse thread state ${stateId}:`, error);
		return null;
	}
}

export async function getThreadStateWithMetadata(
	stateId: string,
): Promise<ThreadStateWithMetadata | null> {
	const state = await redis.get<string>(stateId);
	if (!state) return null;

	try {
		return JSON.parse(state) as ThreadStateWithMetadata;
	} catch (error) {
		console.error(
			`Failed to parse thread state with metadata ${stateId}:`,
			error,
		);
		return null;
	}
}

export async function updateThreadStateMetadata(
	stateId: string,
	metadata: Partial<ThreadStateWithMetadata["metadata"]>,
	userId?: string,
): Promise<void> {
	const existingState = await getThreadStateWithMetadata(stateId);
	if (!existingState) {
		throw new Error(`Thread state not found: ${stateId}`);
	}

	const updatedState: ThreadStateWithMetadata = {
		...existingState,
		metadata: {
			...existingState.metadata,
			...metadata,
		},
	};

	await redis.set(stateId, JSON.stringify(updatedState));

	syncLatestEventToConvex(stateId, existingState.thread, userId);
}
