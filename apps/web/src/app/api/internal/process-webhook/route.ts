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
import { logger, extractRequestContext, measureExecutionTime } from "@/lib/logger";

async function handlePOST(request: NextRequest) {
	const requestContext = logger.logRequestStart(request);
	const startTime = Date.now();

	try {
		logger.info("Processing queued webhook job", {
			...requestContext,
			method: request.method,
			url: request.url,
		});

		// Verify the request comes from QStash
		const body = await measureExecutionTime(
			() => request.text(),
			requestContext,
			"Read request body"
		);
		
		const jobData: QueueJobData = await measureExecutionTime(
			() => JSON.parse(body),
			requestContext,
			"Parse job data"
		);

		logger.debug("Job data parsed", {
			...requestContext,
			hasWebhookPayload: !!jobData.webhookPayload,
			threadStateId: jobData.threadStateId,
			userId: jobData.userId,
		});

		// Validate the webhook payload
		const validationResult = WebhookPayloadSchema.safeParse(
			jobData.webhookPayload,
		);

		if (!validationResult.success) {
			logger.error("Invalid webhook payload in queue job", {
				...requestContext,
				validationErrors: validationResult.error.issues,
			});
			return createErrorResponse(
				"Invalid webhook payload",
				"validation_error",
				400,
				validationResult.error.issues,
			);
		}

		const webhookPayload = validationResult.data;
		logger.info("Processing queued webhook payload", {
			...requestContext,
			type: webhookPayload.type,
			threadStateId: jobData.threadStateId,
		});

		// Get thread from payload using the existing utility
		const thread = await measureExecutionTime(
			() => getThreadFromPayload(webhookPayload),
			requestContext,
			"Get thread from payload"
		);

		logger.debug("Thread retrieved from payload", {
			...requestContext,
			eventCount: thread.events.length,
		});

		try {
			await measureExecutionTime(
				() => handleHumanResponse(thread, webhookPayload, jobData.threadStateId),
				requestContext,
				"Handle human response"
			);

			// Add UI event to Convex - only if processing succeeded
			if (jobData.threadStateId) {
				trackWebhookEvent(
					jobData.threadStateId,
					webhookPayload,
					"webhook_processed",
					{ success: true },
					jobData.userId,
				);
				
				logger.logWebhookEvent(requestContext, "webhook_processed", webhookPayload.type, jobData.threadStateId);
			}

			logger.info("Successfully processed queued webhook job", {
				...requestContext,
				payloadType: webhookPayload.type,
				threadStateId: jobData.threadStateId,
			});

			const duration = Date.now() - startTime;
			logger.logRequestEnd(requestContext, 200, duration);

			return createSuccessResponse("Webhook job processed successfully", {
				payloadType: webhookPayload.type,
			});
		} catch (processingError) {
			logger.error("Failed to process webhook payload", {
				...requestContext,
				threadStateId: jobData.threadStateId,
			}, processingError instanceof Error ? processingError : new Error(String(processingError)));

			// Add error event to Convex for tracking
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

			// Re-throw to let QStash retry
			throw processingError;
		}
	} catch (error) {
		const duration = Date.now() - startTime;
		logger.error("Error processing queued webhook job", {
			...requestContext,
			duration: `${duration}ms`,
		}, error instanceof Error ? error : new Error(String(error)));

		logger.logRequestEnd(requestContext, 500, duration);

		// Return error response that QStash can retry
		return createErrorResponse(
			"Failed to process webhook job",
			error instanceof Error ? error.message : "Unknown error",
			500,
		);
	}
}

export const POST = verifySignatureAppRouter(handlePOST);
