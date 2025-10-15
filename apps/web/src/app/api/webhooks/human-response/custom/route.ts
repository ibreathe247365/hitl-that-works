import { WebhookPayloadSchema } from "@hitl/ai/schemas";
import { type NextRequest, NextResponse } from "next/server";
import { getUserIdByStateId, processMessage } from "@/lib/message-processing";
import { createErrorResponse } from "@/lib/webhook";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const stateId = searchParams.get("stateId") || "";
  const fn = searchParams.get("fn") || "";
  const kwargs = searchParams.get("kwargs") || "{}";
  const html = `<!doctype html><html><body style="font-family: -apple-system, system-ui, Segoe UI, Roboto, Helvetica, Arial, sans-serif; padding: 24px;">
    <h3>Provide custom feedback</h3>
    <form method="POST">
      <input type="hidden" name="stateId" value="${stateId}">
      <input type="hidden" name="fn" value="${fn}">
      <input type="hidden" name="kwargs" value='${kwargs}'>
      <div style="margin: 12px 0">
        <label for="comment">Comment</label><br/>
        <textarea id="comment" name="comment" rows="6" style="width: 100%" required></textarea>
      </div>
      <button type="submit">Submit</button>
    </form>
  </body></html>`;
  return new NextResponse(html, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("application/x-www-form-urlencoded")) {
    return createErrorResponse("Unsupported content type", "bad_request", 400);
  }
  const form = await request.formData();
  const stateId = (form.get("stateId") as string) || undefined;
  const fn = (form.get("fn") as string) || "";
  const kwargsRaw = (form.get("kwargs") as string) || "{}";
  const comment = (form.get("comment") as string) || "";
  let kwargs: any = {};
  try { kwargs = JSON.parse(kwargsRaw); } catch {}

  const webhookPayload = {
    type: "function_call.completed",
    event: {
      spec: { fn, kwargs, state: { stateId } },
      status: { approved: true, comment },
    },
  } as const;

  const validation = WebhookPayloadSchema.safeParse(webhookPayload);
  if (!validation.success) {
    return createErrorResponse("Invalid constructed payload", "validation_error", 400, validation.error.flatten());
  }

  await processMessage({
    webhookPayload: validation.data,
    stateId,
    userId: stateId ? await getUserIdByStateId(stateId) : undefined,
    source: "external",
  });

  const html = `<!doctype html><html><body style="font-family: -apple-system, system-ui, Segoe UI, Roboto, Helvetica, Arial, sans-serif; padding: 24px;">
    <p>Submitted custom feedback. You can close this window.</p>
  </body></html>`;
  return new NextResponse(html, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } });
}


