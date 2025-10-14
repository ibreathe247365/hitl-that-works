import { Inngest } from "inngest";
import type { WebhookPayload } from "./schemas";

const inngest = new Inngest({ id: "HITL" });

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
 * Enqueue a webhook processing job to Inngest or process directly for localhost
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
	const jobData: QueueJobData = {
		webhookPayload,
		threadStateId,
		userId,
		timestamp: new Date().toISOString(),
	};

	const result = await inngest.send({
		name: "app/webhook.received",
		data: jobData,
	});
	const jobId =
		Array.isArray(result?.ids) && result.ids[0]
			? result.ids[0]
			: `event_${Date.now()}`;

	console.log(`Enqueued webhook processing job: ${jobId}`, {
		payloadType: webhookPayload.type,
		threadStateId,
	});

	return jobId;
}

export { QUEUE_CONFIG };
