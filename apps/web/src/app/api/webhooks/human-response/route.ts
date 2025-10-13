import { WebhookPayloadSchema } from "@hitl/ai/schemas";
import { type NextRequest, NextResponse } from "next/server";
import { getUserIdByStateId, processMessage } from "@/lib/message-processing";
import {
	createErrorResponse,
	createSuccessResponse,
	extractStateIdFromWebhookPayload,
	getWebhookConfig,
	verifyWebhookSignature,
} from "@/lib/webhook";

export async function POST(request: NextRequest) {
	try {
		const rawBody = await request.text();

		if (!verifyWebhookSignature(request, rawBody)) {
			return createErrorResponse(
				"Invalid webhook signature",
				"signature_verification_failed",
				400,
			);
		}

		const body = JSON.parse(rawBody);

		const validationResult = WebhookPayloadSchema.safeParse(body);

		if (!validationResult.success) {
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
		const threadStateId = extractStateIdFromWebhookPayload(webhookPayload);

		let userId: string | undefined;
		if (threadStateId) {
			userId = await getUserIdByStateId(threadStateId);
		}

		const result = await processMessage({
			webhookPayload,
			stateId: threadStateId,
			userId,
			source: "external",
		});

		return createSuccessResponse(
			"Webhook payload enqueued for processing",
			{
				payloadType: webhookPayload.type,
				jobId: result.jobId,
				threadStateId: result.stateId,
			},
			202,
		);
	} catch (error) {
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
