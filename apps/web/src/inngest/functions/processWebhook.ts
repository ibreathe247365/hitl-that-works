import type { QueueJobData } from "@hitl/ai";
import { getThreadState, handleHumanResponse, saveThreadState } from "@hitl/ai";
import { inngest } from "@/lib/inngest";

export const processWebhook = inngest.createFunction(
	{
		id: "process-webhook",
		concurrency: [{ limit: 5 }, { limit: 1, key: "event.data.threadStateId" }],
	},
	{ event: "app/webhook.received" },
	async ({ event }) => {
		const data = event.data as QueueJobData;
		const { webhookPayload, threadStateId } = data;

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

		await handleHumanResponse(
			thread || { events: [] },
			webhookPayload,
			threadStateId,
		);
		return { ok: true };
	},
);
