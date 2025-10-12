import { api } from "@hitl/backend/convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";
import type { NextRequest } from "next/server";
import {
	createErrorResponse,
	createSuccessResponse,
	generateInternalWebhookHeaders,
} from "@/lib/webhook";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { stateId, message, userId } = body;

		if (!message || !userId) {
			return createErrorResponse(
				"Message and userId are required",
				"validation_error",
				400,
				{ required: ["message", "userId"] },
			);
		}

		const finalStateId =
			stateId ||
			`thread_${Date.now()}_${Math.random().toString(36).substring(7)}`;

		// Create thread entry in database immediately if it's a new thread
		if (!stateId) {
			try {
				await convex.mutation(api.threads.addEvent, {
					stateId: finalStateId,
					type: "thread_created",
					data: { message: "Thread created", userId },
					userId: userId,
				});
				console.log("Created new thread in database:", finalStateId);
			} catch (error) {
				console.error("Failed to create thread in database:", error);
				// Continue anyway - the thread will be created later by addThreadEvent
			}
		}

		const webhookPayload = {
			type: "human_contact.completed" as const,
			event: {
				status: {
					response: message,
				},
				state: {
					stateId: finalStateId,
				},
			},
		};

		const payloadBody = JSON.stringify(webhookPayload);
		const headers = generateInternalWebhookHeaders(payloadBody);

		const webhookResponse = await fetch("/api/webhooks/human-response", {
			method: "POST",
			headers,
			body: payloadBody,
		});

		if (!webhookResponse.ok) {
			throw new Error(`Webhook failed: ${webhookResponse.statusText}`);
		}

		return createSuccessResponse("Message sent successfully", {
			stateId: finalStateId,
		});
	} catch (error) {
		console.error("Error sending message:", error);
		return createErrorResponse(
			"Failed to send message",
			error instanceof Error ? error.message : "Unknown error",
			500,
		);
	}
}
