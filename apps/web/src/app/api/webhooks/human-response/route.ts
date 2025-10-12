import { enqueueWebhookProcessing } from "@hitl/ai";
import { WebhookPayloadSchema } from "@hitl/ai/schemas";
import { api } from "@hitl/backend/convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";
import { type NextRequest, NextResponse } from "next/server";
import {
	createErrorResponse,
	createSuccessResponse,
	extractStateIdFromWebhookPayload,
	getWebhookConfig,
	trackWebhookEvent,
	verifyWebhookSignature,
} from "@/lib/webhook";
import { logger, extractRequestContext, measureExecutionTime } from "@/lib/logger";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
	const requestContext = logger.logRequestStart(request);
	const startTime = Date.now();

	try {
		logger.info("Human response webhook received", requestContext);

		// Get and verify webhook signature
		const rawBody = await measureExecutionTime(
			() => request.text(),
			requestContext,
			"Read request body"
		);
		
		logger.debug("Request body read", {
			...requestContext,
			bodySize: rawBody.length,
		});

		if (!verifyWebhookSignature(request, rawBody)) {
			logger.warn("Invalid webhook signature", requestContext);
			return createErrorResponse(
				"Invalid webhook signature",
				"signature_verification_failed",
				400,
			);
		}

		// Parse and validate payload
		const body = await measureExecutionTime(
			() => JSON.parse(rawBody),
			requestContext,
			"Parse JSON payload"
		);
		
		const validationResult = WebhookPayloadSchema.safeParse(body);

		if (!validationResult.success) {
			logger.error("Validation failed", {
				...requestContext,
				validationErrors: validationResult.error.issues,
			});
			return createErrorResponse(
				"Invalid request data - must be a valid webhook payload",
				"validation_error",
				400,
				validationResult.error.issues.map((err: any) => ({
					field: err.path.join("."),
					message: err.message,
				})),
			);
		}

		const webhookPayload = validationResult.data;
		logger.info("Webhook payload validated", {
			...requestContext,
			payloadType: webhookPayload.type,
		});

		logger.info("Enqueuing webhook payload for processing", {
			...requestContext,
			type: webhookPayload.type,
		});

		// Get thread state ID from payload for tracking
		const threadStateId = extractStateIdFromWebhookPayload(webhookPayload);
		logger.debug("Extracted state ID from payload", {
			...requestContext,
			threadStateId,
		});

		// Look up userId from the thread if we have a stateId
		let userId: string | undefined;
		if (threadStateId) {
			try {
				const foundUserId = await measureExecutionTime(
					() => convex.query(api.threads.getUserIdByStateId, {
						stateId: threadStateId,
					}),
					requestContext,
					"Look up user ID by state ID"
				);
				userId = foundUserId || undefined;
				logger.info("Found userId for thread", { 
					...requestContext,
					threadStateId, 
					userId 
				});
			} catch (error) {
				logger.error("Failed to get userId for thread", {
					...requestContext,
					threadStateId,
				}, error instanceof Error ? error : new Error(String(error)));
				// Continue without userId - it's optional
			}
		}

		const jobId = await measureExecutionTime(
			() => enqueueWebhookProcessing(
				webhookPayload,
				threadStateId,
				userId,
			),
			requestContext,
			"Enqueue webhook processing"
		);

		logger.logQueueOperation(requestContext, "enqueue", jobId, "webhook-processing");

		if (threadStateId) {
			trackWebhookEvent(
				threadStateId,
				webhookPayload,
				"webhook_received",
				{ jobId },
				userId,
			);
			
			logger.logWebhookEvent(requestContext, "webhook_received", webhookPayload.type, threadStateId);
		}

		const duration = Date.now() - startTime;
		logger.logRequestEnd(requestContext, 202, duration);

		return createSuccessResponse(
			"Webhook payload enqueued for processing",
			{
				payloadType: webhookPayload.type,
				jobId,
				threadStateId,
			},
			202,
		);
	} catch (error) {
		const duration = Date.now() - startTime;
		logger.error("Human response webhook error", {
			...requestContext,
			duration: `${duration}ms`,
		}, error instanceof Error ? error : new Error(String(error)));

		logger.logRequestEnd(requestContext, 500, duration);

		if (error instanceof Error) {
			if (error.message.includes("QStash")) {
				return createErrorResponse(error.message, "queue_error", 500);
			}
		}

		return createErrorResponse(
			"Error enqueuing webhook processing",
			error instanceof Error ? error.message : "Unknown error",
			500,
		);
	}
}

export async function GET(_request: NextRequest) {
	const config = getWebhookConfig();

	return NextResponse.json({
		message: "Human Response Webhook endpoint",
		description:
			"This endpoint enqueues human responses and function call completions for AI agent processing",
		method: "POST",
		webhookVerification: {
			enabled: config.webhookSecret,
			requiredHeaders: config.requiredHeaders,
			environmentVariables: config.environmentVariables,
		},
		supportedPayloads: [
			{
				type: "human_contact.completed",
				description: "Human contact completion webhook",
				example: {
					type: "human_contact.completed",
					event: {
						status: { response: "User response message" },
						state: { stateId: "thread-state-id" },
					},
				},
			},
			{
				type: "function_call.completed",
				description: "Function call completion webhook",
				example: {
					type: "function_call.completed",
					event: {
						spec: {
							fn: "promote_vercel_deployment",
							kwargs: { new_deployment: "deployment-id" },
							state: { stateId: "thread-state-id" },
						},
						status: { approved: true, comment: "Approved by user" },
					},
				},
			},
		],
		timestamp: new Date().toISOString(),
		status: "success",
	});
}
