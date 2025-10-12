import { Client } from "@upstash/qstash";
import type { WebhookPayload } from "./schemas";

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
 * Enqueue a webhook processing job to QStash
 * @param webhookPayload The webhook payload to process
 * @param threadStateId Optional thread state ID for tracking
 * @returns Promise<string> The job ID for tracking
 */
export async function enqueueWebhookProcessing(
	webhookPayload: WebhookPayload,
	threadStateId?: string,
	userId?: string,
): Promise<string> {
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
