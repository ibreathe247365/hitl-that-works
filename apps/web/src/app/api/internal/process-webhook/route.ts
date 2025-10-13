import { handleHumanResponse, type QueueJobData } from "@hitl/ai";
import { WebhookPayloadSchema } from "@hitl/ai/schemas";
import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import type { NextRequest } from "next/server";
import {
	createErrorResponse,
	createSuccessResponse,
	getThreadFromPayload,
	trackWebhookEvent,
} from "@/lib/webhook";

async function handlePOST(request: NextRequest) {
	try {
		const body = await request.text();

		const jobData: QueueJobData = JSON.parse(body);

		const validationResult = WebhookPayloadSchema.safeParse(
			jobData.webhookPayload,
		);

		if (!validationResult.success) {
			return createErrorResponse(
				"Invalid webhook payload",
				"validation_error",
				400,
				validationResult.error.issues,
			);
		}

		const webhookPayload = validationResult.data;

		const thread = await getThreadFromPayload(webhookPayload);

		try {
			await handleHumanResponse(thread, webhookPayload, jobData.threadStateId);

			if (jobData.threadStateId) {
				trackWebhookEvent(
					jobData.threadStateId,
					webhookPayload,
					"webhook_processed",
					{ success: true },
					jobData.userId,
				);
			}

			return createSuccessResponse("Webhook job processed successfully", {
				payloadType: webhookPayload.type,
			});
		} catch (processingError) {
			if (jobData.threadStateId) {
				trackWebhookEvent(
					jobData.threadStateId,
					webhookPayload,
					"webhook_processed",
					{
						success: false,
						error:
							processingError instanceof Error
								? processingError.message
								: "Unknown error",
					},
					jobData.userId,
				);
			}

			throw processingError;
		}
	} catch (error) {
		return createErrorResponse(
			"Failed to process webhook job",
			error instanceof Error ? error.message : "Unknown error",
			500,
		);
	}
}

export const POST = verifySignatureAppRouter(handlePOST);
