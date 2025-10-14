import type { QueueJobData } from "@hitl/ai";
import {
	failOperation,
	getThreadState,
	handleHumanResponse,
	saveThreadState,
	startOperation,
	succeedOperation,
} from "@hitl/ai";
import { inngest } from "@/lib/inngest";

export const processWebhook = inngest.createFunction(
	{
		id: "process-webhook",
		concurrency: [{ limit: 5 }, { limit: 1, key: "event.data.threadStateId" }],
	},
	{ event: "app/webhook.received" },
	async ({ event }) => {
		const data = event.data as QueueJobData;
		const { webhookPayload, threadStateId, operationId } = data;

		let thread = await getThreadState(threadStateId || "");
		if (!thread && threadStateId) {
			await saveThreadState(
				{ events: [], initial_email: null },
				undefined,
				undefined,
				threadStateId,
			);
			thread = await getThreadState(threadStateId);
		}

		let startedAt: string | undefined;
		if (threadStateId) {
			startedAt = new Date().toISOString();
			startOperation(threadStateId, "queue", "webhook.process", {
				source: "queue",
				operationId,
			});
		}

		try {
			await handleHumanResponse(
				thread || { events: [] },
				webhookPayload,
				threadStateId,
			);
			if (threadStateId && operationId) {
				succeedOperation(threadStateId, "queue", operationId, {
					result: { ok: true },
					startedAt,
					name: "webhook.process",
					source: "queue",
				});
			}
			return { ok: true };
		} catch (err) {
			if (threadStateId && operationId) {
				failOperation(threadStateId, "queue", operationId, err, {
					startedAt,
					name: "webhook.process",
					source: "queue",
				});
			}
			throw err;
		}
	},
);
