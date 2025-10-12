import {
	addThreadEvent,
	handleHumanResponse,
	type QueueJobData,
} from "@hitl/ai";
import { WebhookPayloadSchema } from "@hitl/ai/schemas";
import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import type { NextRequest } from "next/server";
import {
	createErrorResponse,
	createSuccessResponse,
	getThreadFromPayload,
} from "@/lib/webhook";

async function handlePOST(request: NextRequest) {
	try {
		console.log("Processing queued webhook job:", {
			method: request.method,
			url: request.url,
		});

		// Verify the request comes from QStash
		const body = await request.text();
		const jobData: QueueJobData = JSON.parse(body);

		// Validate the webhook payload
		const validationResult = WebhookPayloadSchema.safeParse(
			jobData.webhookPayload,
		);

		if (!validationResult.success) {
			console.error(
				"Invalid webhook payload in queue job:",
				validationResult.error,
			);
			return createErrorResponse(
				"Invalid webhook payload",
				"validation_error",
				400,
				validationResult.error.issues,
			);
		}

		const webhookPayload = validationResult.data;
		console.log("Processing queued webhook payload:", {
			type: webhookPayload.type,
			threadStateId: jobData.threadStateId,
		});

		// Get thread from payload using the existing utility
		const thread = await getThreadFromPayload(webhookPayload);

		try {
			await handleHumanResponse(thread, webhookPayload);

			// Add UI event to Convex - only if processing succeeded
			if (jobData.threadStateId) {
				addThreadEvent(
					jobData.threadStateId,
					{
						type: "webhook_processed",
						data: {
							payloadType: webhookPayload.type,
							processedAt: new Date().toISOString(),
							success: true,
						},
					},
					undefined,
					jobData.userId,
				);
			}

			console.log("Successfully processed queued webhook job:", {
				payloadType: webhookPayload.type,
				threadStateId: jobData.threadStateId,
			});

			return createSuccessResponse("Webhook job processed successfully", {
				payloadType: webhookPayload.type,
			});
		} catch (processingError) {
			console.error("Failed to process webhook payload:", processingError);

			// Add error event to Convex for tracking
			if (jobData.threadStateId) {
				addThreadEvent(
					jobData.threadStateId,
					{
						type: "webhook_processed",
						data: {
							payloadType: webhookPayload.type,
							processedAt: new Date().toISOString(),
							success: false,
							error:
								processingError instanceof Error
									? processingError.message
									: "Unknown error",
						},
					},
					undefined,
					jobData.userId,
				);
			}

			// Re-throw to let QStash retry
			throw processingError;
		}
	} catch (error) {
		console.error("Error processing queued webhook job:", error);

		// Return error response that QStash can retry
		return createErrorResponse(
			"Failed to process webhook job",
			error instanceof Error ? error.message : "Unknown error",
			500,
		);
	}
}

export const POST = verifySignatureAppRouter(handlePOST);
