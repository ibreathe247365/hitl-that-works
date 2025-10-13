import { Client } from "@upstash/qstash";
import { handleHumanResponse } from "./agent";
import type { WebhookPayload } from "./schemas";
import { getThreadState, saveThreadState } from "./state";

const qstash = new Client({
	token: process.env.QSTASH_TOKEN,
});

const QUEUE_CONFIG = {
	maxConcurrency: 5,
	retries: 3,
	retryDelay: 1000,
};

export interface QueueJobData {
	webhookPayload: WebhookPayload;
	threadStateId?: string;
	userId?: string;
	timestamp: string;
}

/**
 * Process webhook directly without using the queue (for localhost development)
 * @param webhookPayload The webhook payload to process
 * @param threadStateId Optional thread state ID for tracking
 * @param userId Optional user ID
 * @returns Promise<string> A mock job ID for consistency
 */
async function processWebhookDirectly(
	webhookPayload: WebhookPayload,
	threadStateId?: string,
): Promise<string> {
	const mockJobId = `direct_${Date.now()}_${Math.random().toString(36).substring(7)}`;

	console.log(`Processing webhook directly (localhost mode): ${mockJobId}`, {
		payloadType: webhookPayload.type,
		threadStateId,
	});

	try {
		// Get the thread from Redis
		let thread = await getThreadState(threadStateId || "");

		// If thread doesn't exist, create an initial thread state
		if (!thread) {
			console.log(
				`Creating initial thread state for stateId: ${threadStateId}`,
			);

			// Create initial thread with the human response
			const initialThread = {
				events: [
					{
						type: "human_response",
						data:
							webhookPayload.type === "human_contact.completed"
								? (webhookPayload as any).event?.status?.response ||
									"No response provided"
								: "Initial message",
					},
				],
				initial_email: null,
			};

			// Save the initial thread state
			await saveThreadState(initialThread, undefined, undefined, threadStateId);

			// Get the thread again to ensure it was saved
			thread = await getThreadState(threadStateId || "");

			if (!thread) {
				throw new Error(
					`Failed to create thread state for stateId: ${threadStateId}`,
				);
			}
		}

		// Process the webhook directly
		await handleHumanResponse(thread, webhookPayload, threadStateId);

		console.log(`Successfully processed webhook directly: ${mockJobId}`);
		return mockJobId;
	} catch (error) {
		console.error(`Failed to process webhook directly ${mockJobId}:`, error);
		throw error;
	}
}

/**
 * Check if we're running in localhost/development mode
 * @returns boolean True if running locally
 */
function isLocalhostMode(): boolean {
	const nodeEnv = process.env.NODE_ENV;
	const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

	return (
		nodeEnv === "development" ||
		nodeEnv === "test" ||
		appUrl.includes("localhost") ||
		appUrl.includes("127.0.0.1")
	);
}

/**
 * Enqueue a webhook processing job to QStash or process directly for localhost
 * @param webhookPayload The webhook payload to process
 * @param threadStateId Optional thread state ID for tracking
 * @param userId Optional user ID
 * @returns Promise<string> The job ID for tracking
 */
export async function enqueueWebhookProcessing(
	webhookPayload: WebhookPayload,
	threadStateId?: string,
	userId?: string,
): Promise<string> {
	// Check if we're in localhost mode and bypass the queue
	if (isLocalhostMode()) {
		console.log("Localhost mode detected - processing webhook directly");
		return await processWebhookDirectly(webhookPayload, threadStateId);
	}

	// Production mode - use QStash queue
	const jobData: QueueJobData = {
		webhookPayload,
		threadStateId,
		userId,
		timestamp: new Date().toISOString(),
	};

	const response = await qstash.publishJSON({
		url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"}/api/internal/process-webhook`,
		body: jobData,
		headers: {
			"Content-Type": "application/json",
		},
		retries: QUEUE_CONFIG.retries,
		delay: QUEUE_CONFIG.retryDelay,
	});

	const jobId = response.messageId;

	console.log(`Enqueued webhook processing job: ${jobId}`, {
		payloadType: webhookPayload.type,
		threadStateId,
	});

	return jobId;
}

/**
 * Get job status from QStash
 * @param jobId The job ID to check
 * @returns Promise<any> Job status information
 */
export async function getJobStatus(jobId: string): Promise<any> {
	try {
		return await qstash.messages.get(jobId);
	} catch (error) {
		console.error(`Failed to get job status for ${jobId}:`, error);
		return null;
	}
}

/**
 * Cancel a queued job
 * @param jobId The job ID to cancel
 * @returns Promise<boolean> Success status
 */
export async function cancelJob(jobId: string): Promise<boolean> {
	try {
		await qstash.messages.delete(jobId);
		console.log(`Cancelled job: ${jobId}`);
		return true;
	} catch (error) {
		console.error(`Failed to cancel job ${jobId}:`, error);
		return false;
	}
}

export { QUEUE_CONFIG };
