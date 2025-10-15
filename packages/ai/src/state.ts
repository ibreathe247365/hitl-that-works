import { Redis } from "@upstash/redis";
import { z } from "zod";
import type { Thread } from "./schemas";
import { ThreadSchema } from "./schemas";
import { syncLatestEventToConvex } from "./sync";

const redis = new Redis({
	url: process.env.UPSTASH_REDIS_REST_URL,
	token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Zod schema for metadata
const ThreadMetadataSchema = z.object({
	jobId: z.string().optional(),
	enqueuedAt: z.string().optional(),
	processingAttempts: z.number().optional(),
	lastProcessedAt: z.string().optional(),
});

// Zod schema for the complete Redis data structure
export const ThreadStateWithMetadataSchema = z.object({
	thread: ThreadSchema,
	metadata: ThreadMetadataSchema.optional(),
});

// Export inferred types
export type ThreadMetadata = z.infer<typeof ThreadMetadataSchema>;
export type ThreadStateWithMetadata = z.infer<
	typeof ThreadStateWithMetadataSchema
>;

export async function saveThreadState(
	thread: Thread,
	metadata?: ThreadStateWithMetadata["metadata"],
	userId?: string,
	existingStateId?: string,
): Promise<string> {
	const stateId =
		existingStateId ||
		`thread_${Date.now()}_${Math.random().toString(36).substring(7)}`;

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
		const validated = ThreadStateWithMetadataSchema.parse(state);
		return validated.thread;
	} catch (_error) {
		return null;
	}
}

export async function getThreadStateWithMetadata(
	stateId: string,
): Promise<ThreadStateWithMetadata | null> {
	const state = await redis.get<string>(stateId);
	if (!state) return null;

	try {
		return ThreadStateWithMetadataSchema.parse(state);
	} catch (_error) {
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

export async function updateThreadState(
	stateId: string,
	thread: Thread,
	userId?: string,
): Promise<void> {
	const validatedThread = ThreadSchema.parse(thread);

	const existingState = await getThreadStateWithMetadata(stateId);
	if (!existingState) {
		throw new Error(`Thread state not found: ${stateId}`);
	}

	const updatedState: ThreadStateWithMetadata = {
		...existingState,
		thread: validatedThread,
		metadata: {
			...existingState.metadata,
			lastProcessedAt: new Date().toISOString(),
		},
	};

	await redis.set(stateId, JSON.stringify(updatedState));

	syncLatestEventToConvex(stateId, validatedThread, userId);
}
