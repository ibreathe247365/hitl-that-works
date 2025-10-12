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

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
	try {
		console.log("Human response webhook received:", {
			method: request.method,
			url: request.url,
		});

		// Get and verify webhook signature
		const rawBody = await request.text();
		if (!verifyWebhookSignature(request, rawBody)) {
			return createErrorResponse(
				"Invalid webhook signature",
				"signature_verification_failed",
				400,
			);
		}

		// Parse and validate payload
		const body = JSON.parse(rawBody);
		const validationResult = WebhookPayloadSchema.safeParse(body);

		if (!validationResult.success) {
			console.error("Validation failed:", validationResult.error);
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
		console.log("Enqueuing webhook payload for processing:", {
			type: webhookPayload.type,
		});

		// Get thread state ID from payload for tracking
		const threadStateId = extractStateIdFromWebhookPayload(webhookPayload);

		// Look up userId from the thread if we have a stateId
		let userId: string | undefined;
		if (threadStateId) {
			try {
				const foundUserId = await convex.query(api.threads.getUserIdByStateId, {
					stateId: threadStateId,
				});
				userId = foundUserId || undefined;
				console.log("Found userId for thread:", { threadStateId, userId });
			} catch (error) {
				console.error("Failed to get userId for thread:", error);
				// Continue without userId - it's optional
			}
		}

		const jobId = await enqueueWebhookProcessing(
			webhookPayload,
			threadStateId,
			userId,
		);

		if (threadStateId) {
			trackWebhookEvent(
				threadStateId,
				webhookPayload,
				"webhook_received",
				{ jobId },
				userId,
			);
		}

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
		console.error("Human response webhook error:", error);

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
