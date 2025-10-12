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
		// Parse request body
		const body = await request.json();
		const { stateId, message, email } = body;

		// Validate required fields
		if (!message) {
			return createErrorResponse(
				"Message is required",
				"validation_error",
				400,
				{ required: ["message"] },
			);
		}

		if (!email) {
			return createErrorResponse(
				"Email is required",
				"validation_error",
				400,
				{ required: ["email"] },
			);
		}

		// Look up user by email
		const user = await convex.query(api.auth.getUserByEmail, { email });
		
		if (!user) {
			return createErrorResponse(
				"User not found with the provided email",
				"user_not_found",
				404,
				{ email },
			);
		}

		const userId = user._id;

		// Generate or use existing state ID
		const finalStateId =
			stateId ||
			`thread_${Date.now()}_${Math.random().toString(36).substring(7)}`;

		// Create thread if it's new
		if (!stateId) {
			try {
				await convex.mutation(api.threads.addEvent, {
					stateId: finalStateId,
					type: "thread_created",
					data: { message: "Thread created", userId },
					userId: userId,
				});
			} catch (error) {
				// Continue anyway - the thread will be created later by addThreadEvent
			}
		}

		// Prepare webhook payload
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

		// Send webhook
		const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/api/webhooks/human-response`;
		const webhookResponse = await fetch(webhookUrl, {
			method: "POST",
			headers,
			body: payloadBody,
		});

		if (!webhookResponse.ok) {
			const errorMessage = `Webhook failed: ${webhookResponse.statusText}`;
			throw new Error(errorMessage);
		}

		return createSuccessResponse("Message sent successfully", {
			stateId: finalStateId,
		});
	} catch (error) {
		return createErrorResponse(
			"Failed to send message",
			error instanceof Error ? JSON.stringify(error.cause) : "Unknown error",
			500,
		);
	}
}
