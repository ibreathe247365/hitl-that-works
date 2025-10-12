import crypto from "node:crypto";
import { getThreadState, type Thread, addThreadEvent } from "@hitl/ai";
import type { WebhookPayload } from "@hitl/ai/schemas";
import { type NextRequest, NextResponse } from "next/server";
import * as svix from "svix";

// Configuration
const webhookSecret = process.env.WEBHOOK_SIGNING_SECRET;
const debugMode = process.env.DEBUG_DISABLE_WEBHOOK_VERIFICATION === "true";
const webhookVerifier = webhookSecret ? new svix.Webhook(webhookSecret) : null;

// Helper functions
export const verifyWebhookSignature = (
	request: NextRequest,
	body: string,
): boolean => {
	if (debugMode || !webhookVerifier) return true;

	try {
		const headers = request.headers;
		webhookVerifier.verify(body, {
			"svix-id": headers.get("svix-id") as string,
			"svix-timestamp": headers.get("svix-timestamp") as string,
			"svix-signature": headers.get("svix-signature") as string,
		});
		return true;
	} catch (err) {
		console.error("Webhook signature verification failed:", err);
		return false;
	}
};

export const createErrorResponse = (
	message: string,
	error: string,
	status: number,
	details?: any,
) =>
	NextResponse.json(
		{
			message,
			error,
			status: "error",
			timestamp: new Date().toISOString(),
			...(details && { details }),
		},
		{ status },
	);

export const createSuccessResponse = (
	message: string,
	data?: any,
	status = 200,
) =>
	NextResponse.json(
		{
			message,
			status: "success",
			timestamp: new Date().toISOString(),
			...(data && { data }),
		},
		{ status },
	);

export const getThreadFromPayload = async (
	payload: WebhookPayload,
): Promise<Thread> => {
	// Both payload types can have state information
	let stateId: string | undefined;

	if (payload.type === "function_call.completed") {
		stateId = payload.event.spec.state?.stateId;
	} else if (payload.type === "human_contact.completed") {
		stateId = payload.event.state?.stateId;
	}

	// If we have a stateId, try to load the thread from state
	if (stateId) {
		try {
			const thread = await getThreadState(stateId);
			if (!thread) {
				console.warn(
					`Thread state not found for ${stateId}, creating new thread`,
				);
				return { events: [] };
			}
			return thread;
		} catch (error) {
			console.error(`Failed to load thread state ${stateId}:`, error);
			return { events: [] };
		}
	}

	// If no stateId, return empty thread (fallback)
	return { events: [] };
};

export const getWebhookConfig = () => ({
	webhookSecret: !!webhookSecret && !debugMode,
	debugMode,
	requiredHeaders: ["svix-id", "svix-timestamp", "svix-signature"],
	environmentVariables: {
		WEBHOOK_SIGNING_SECRET: "Required for production",
		DEBUG_DISABLE_WEBHOOK_VERIFICATION: 'Set to "true" to disable verification',
	},
});

export const generateInternalWebhookHeaders = (
	body: string,
): Record<string, string> => {
	if (debugMode || !webhookSecret) return {};

	const timestamp = Math.floor(Date.now() / 1000).toString();
	const id = crypto.randomUUID();

	const payload = `${id}.${timestamp}.${body}`;
	const signature = crypto
		.createHmac("sha256", webhookSecret)
		.update(payload)
		.digest("base64");

	return {
		"svix-id": id,
		"svix-timestamp": timestamp,
		"svix-signature": `v1,${signature}`,
		"Content-Type": "application/json",
	};
};

/**
 * Extract stateId from webhook payload
 * @param payload The webhook payload to extract stateId from
 * @returns The stateId if found, undefined otherwise
 */
export const extractStateIdFromWebhookPayload = (
	payload: WebhookPayload,
): string | undefined => {
	if (payload.type === "function_call.completed") {
		return payload.event.spec.state?.stateId;
	} else if (payload.type === "human_contact.completed") {
		return payload.event.state?.stateId;
	}
	return undefined;
};

/**
 * Track webhook event in Convex database
 * @param stateId The thread state ID
 * @param payload The webhook payload
 * @param eventType The type of event to track
 * @param additionalData Additional data to include in the event
 * @param userId Optional user ID
 */
export const trackWebhookEvent = (
	stateId: string,
	payload: WebhookPayload,
	eventType: "webhook_received" | "webhook_processed",
	additionalData: Record<string, any> = {},
	userId?: string,
): void => {
	const eventData: Record<string, any> = {
		payloadType: payload.type,
		...additionalData,
	};

	if (eventType === "webhook_received") {
		eventData.receivedAt = new Date().toISOString();
	} else if (eventType === "webhook_processed") {
		eventData.processedAt = new Date().toISOString();
	}

	addThreadEvent(
		stateId,
		{
			type: eventType,
			data: eventData,
		},
		undefined,
		userId,
	);
};
