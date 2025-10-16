import { sendEmailFunctionApprovalRequest } from "@hitl/ai";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createErrorResponse, createSuccessResponse } from "@/lib/webhook";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json().catch(() => ({}) as any);
		const { stateId, fn, kwargs, subject, message } = body ?? {};

		if (!process.env.RESEND_API_KEY) {
			return createErrorResponse(
				"RESEND_API_KEY is not set",
				"config_error",
				500,
			);
		}

		const result = await sendEmailFunctionApprovalRequest(
			message || "Please approve this operation.",
			{ email: { address: "delivered@resend.dev", subject } },
			stateId || "test-state-id",
			fn || "example_function",
			kwargs || { example: true },
		);

		if (!result.success) {
			return createErrorResponse(
				result.error || "Failed to send email",
				"resend_error",
				500,
			);
		}

		return createSuccessResponse("Approval email sent", {
			id: result.messageId,
		});
	} catch (error) {
		return NextResponse.json(
			{
				message: "Failed to send test email",
				status: "error",
				error: error instanceof Error ? error.message : "Unknown error",
				timestamp: new Date().toISOString(),
			},
			{ status: 500 },
		);
	}
}
