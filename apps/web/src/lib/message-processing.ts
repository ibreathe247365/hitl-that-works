import { api } from "@hitl/backend/convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";
import { enqueueWebhookProcessing } from "@hitl/ai";
import type { WebhookPayload } from "@hitl/ai/schemas";
import { trackWebhookEvent } from "./webhook";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export interface ProcessMessageOptions {
	webhookPayload: WebhookPayload;
	stateId?: string;
	userId?: string;
	source: "internal" | "external";
}

export interface ProcessMessageResult {
	jobId: string;
	stateId: string;
	userId?: string;
}

/**
 * Shared message processing function used by both internal and external routes
 * @param options Processing options including payload, stateId, userId, and source
 * @returns Processing result with jobId, stateId, and userId
 */
export async function processMessage(
	options: ProcessMessageOptions,
): Promise<ProcessMessageResult> {
	const { webhookPayload, stateId, userId, source } = options;

	// Enqueue the webhook processing
	const jobId = await enqueueWebhookProcessing(
		webhookPayload,
		stateId,
		userId,
	);

	// Track the event with source information
	if (stateId) {
		trackWebhookEvent(
			stateId,
			webhookPayload,
			"webhook_received",
			{ jobId, source },
			userId,
		);
	}

	return {
		jobId,
		stateId: stateId || "",
		userId,
	};
}

/**
 * Get user by email (used by internal send-message route)
 * @param email User email address
 * @returns User object or null if not found
 */
export async function getUserByEmail(email: string) {
	return await convex.query(api.auth.getUserByEmail, { email });
}

/**
 * Get user by stateId (used by webhook route)
 * @param stateId Thread state ID
 * @returns User ID or undefined if not found
 */
export async function getUserIdByStateId(stateId: string): Promise<string | undefined> {
	try {
		const foundUserId = await convex.query(api.threads.getUserIdByStateId, {
			stateId,
		});
		return foundUserId || undefined;
	} catch (error) {
		return undefined;
	}
}

/**
 * Create a new thread state if stateId is not provided
 * @param userId User ID for the thread
 * @param providedStateId Optional existing state ID
 * @returns Final state ID (either provided or newly created)
 */
export async function ensureThreadState(
	userId: string,
	providedStateId?: string,
): Promise<string> {
	const finalStateId =
		providedStateId ||
		`thread_${Date.now()}_${Math.random().toString(36).substring(7)}`;

	if (!providedStateId) {
		try {
			await convex.mutation(api.threads.addEvent, {
				stateId: finalStateId,
				type: "thread_created",
				data: { message: "Thread created", userId },
				userId: userId,
			});
		} catch (error) {
			// Log error but don't fail - thread can still be processed
			console.error("Failed to create thread event:", error);
		}
	}

	return finalStateId;
}

/**
 * Create webhook payload for human contact completion
 * @param message User message
 * @param stateId Thread state ID
 * @returns Webhook payload
 */
export function createHumanContactPayload(
	message: string,
	stateId: string,
): WebhookPayload {
	return {
		type: "human_contact.completed",
		event: {
			status: {
				response: message,
			},
			state: {
				stateId,
			},
		},
	};
}
