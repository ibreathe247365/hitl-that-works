import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createErrorResponse, createSuccessResponse } from "@/lib/webhook";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({} as any));
    const { subject, message } = body ?? {};

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return createErrorResponse(
        "RESEND_API_KEY is not set",
        "config_error",
        500,
      );
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Acme <onboarding@resend.dev>",
        to: ["delivered@resend.dev"],
        subject: subject || "Test Email",
        html: `<div><p>${message || "This is a test"}</p></div>`,
      }),
    });

    const json = await response.json();
    if (!response.ok) {
      return createErrorResponse(
        `Resend error: ${json?.message || response.statusText}`,
        "resend_error",
        response.status,
      );
    }

    return createSuccessResponse("Email sent", { id: json?.id });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Failed to send test email",
        status: "error",
        error:
          error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}


