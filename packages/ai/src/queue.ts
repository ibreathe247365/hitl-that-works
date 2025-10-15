import { Inngest } from "inngest";
import type { WebhookPayload } from "./schemas";
import { queueOperation } from "./sync";

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
	operationId?: string;
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
	let operationId: string | undefined;
	if (threadStateId) {
		operationId = queueOperation(threadStateId, "queue", "webhook.process", {
			payload: webhookPayload,
			source: "queue",
		});
	}
	const jobData: QueueJobData = {
		webhookPayload,
		threadStateId,
		userId,
		timestamp: new Date().toISOString(),
		operationId,
	};

	const result = await inngest.send({
		name: "app/webhook.received",
		data: jobData,
	});
	const jobId =
		Array.isArray(result?.ids) && result.ids[0]
			? result.ids[0]
			: `event_${Date.now()}`;

	return jobId;
}

export { QUEUE_CONFIG };
