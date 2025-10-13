import type { NextRequest } from "next/server";
import {
	createErrorResponse,
	createSuccessResponse,
} from "@/lib/webhook";
import {
	processMessage,
	getUserByEmail,
	ensureThreadState,
	createHumanContactPayload,
} from "@/lib/message-processing";


export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { stateId, message, email } = body;

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

		const user = await getUserByEmail(email);
		
		if (!user) {
			return createErrorResponse(
				"User not found with the provided email",
				"user_not_found",
				404,
				{ email },
			);
		}

		const userId = user._id;
		const finalStateId = await ensureThreadState(userId, stateId);

		const webhookPayload = createHumanContactPayload(message, finalStateId);
		const result = await processMessage({
			webhookPayload,
			stateId: finalStateId,
			userId,
			source: "internal",
		});

		return createSuccessResponse("Message sent successfully", {
			stateId: result.stateId,
			jobId: result.jobId,
		});
	} catch (error) {
		return createErrorResponse(
			"Failed to send message",
			error instanceof Error ? JSON.stringify(error.cause) : "Unknown error",
			500,
		);
	}
}
