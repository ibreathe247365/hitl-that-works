// Email contact channel implementation
import { Resend } from "resend";
import type { WebhookPayload } from "../../schemas";
import type {
	EmailContactChannel,
	EmailContactResult,
	RecipientInfo,
} from "../types";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(
	message: string,
	channel: EmailContactChannel,
	stateId: string,
	_recipientInfo?: RecipientInfo,
): Promise<EmailContactResult> {
	try {
		const emailData = {
			from: "Acme <onboarding@resend.dev>",
			to: ["delivered@resend.dev"],
			subject: channel.email.subject || "AI Agent Message",
			html: `
				<div>
					<p>${message}</p>
					<hr>
					<p><small>Thread ID: ${stateId}</small></p>
					<p><small>Got to thread: <a href="https://hitl-that-works-web.vercel.app/dashboard/threads/${stateId}">https://hitl-that-works-web.vercel.app/dashboard/threads/${stateId}</a></small></p>
					<p><small>Reply to this email to respond to the AI agent.</small></p>
				</div>
			`,
			headers: {
				"X-Thread-ID": stateId,
				...(channel.email.in_reply_to_message_id && {
					"In-Reply-To": channel.email.in_reply_to_message_id,
				}),
				...(channel.email.references_message_id && {
					References: channel.email.references_message_id,
				}),
			},
		};

		const result = await resend.emails.send(emailData);

		if (result.error) {
			throw new Error(`Resend error: ${result.error.message}`);
		}

		return {
			success: true,
			channelType: "email",
			messageId: result.data?.id || "unknown",
			timestamp: new Date().toISOString(),
		};
	} catch (error) {
		return {
			success: false,
			channelType: "email",
			messageId: "error",
			error: error instanceof Error ? error.message : "Unknown error",
			timestamp: new Date().toISOString(),
		};
	}
}

export function createEmailWebhookPayload(emailData: any): WebhookPayload {
	return {
		type: "human_contact.completed",
		event: {
			status: {
				response: emailData.body || emailData.text || "Email response received",
			},
			state: {
				stateId: emailData.headers?.["X-Thread-ID"] || emailData.threadId,
			},
		},
	};
}

/**
 * Send an email-based approval request with Approve/Deny/Custom links.
 * Mirrors the Slack approval UX by linking back to the app's human-response endpoints.
 */
export async function sendEmailFunctionApprovalRequest(
	message: string,
	channel: EmailContactChannel,
	stateId: string,
	fn: string,
	kwargs: any,
): Promise<EmailContactResult> {
	try {
		const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "";
		if (!baseUrl) {
			throw new Error("Missing NEXT_PUBLIC_APP_URL env var");
		}

		const encodedKwargs = encodeURIComponent(JSON.stringify(kwargs ?? {}));
		const approveUrl = `${baseUrl}/api/webhooks/human-response?action=approve&stateId=${encodeURIComponent(
			stateId,
		)}&fn=${encodeURIComponent(fn)}&kwargs=${encodedKwargs}`;
		const denyUrl = `${baseUrl}/api/webhooks/human-response?action=deny&stateId=${encodeURIComponent(
			stateId,
		)}&fn=${encodeURIComponent(fn)}&kwargs=${encodedKwargs}`;
		const customUrl = `${baseUrl}/api/webhooks/human-response/custom?stateId=${encodeURIComponent(
			stateId,
		)}&fn=${encodeURIComponent(fn)}&kwargs=${encodedKwargs}`;

		const html = `
			<div>
				<p>${message}</p>
				<hr>
				<p><small>Thread ID: ${stateId}</small></p>
				<p>
					<a href="${approveUrl}" style="display:inline-block;padding:10px 14px;background:#16a34a;color:#fff;text-decoration:none;border-radius:6px;margin-right:8px">Approve</a>
					<a href="${denyUrl}" style="display:inline-block;padding:10px 14px;background:#dc2626;color:#fff;text-decoration:none;border-radius:6px;margin-right:8px">Deny</a>
					<a href="${customUrl}" style="display:inline-block;padding:10px 14px;background:#374151;color:#fff;text-decoration:none;border-radius:6px">Custom…</a>
				</p>
				<p style="margin-top:16px"><small>If the buttons don't work, use these links:</small></p>
				<ul style="padding-left:16px">
					<li><a href="${approveUrl}">Approve</a></li>
					<li><a href="${denyUrl}">Deny</a></li>
					<li><a href="${customUrl}">Custom…</a></li>
				</ul>
			</div>
		`;

		const emailData = {
			from: "Acme <onboarding@resend.dev>",
			to: [channel.email.address || "delivered@resend.dev"],
			subject: channel.email.subject || "Approval requested",
			html,
			headers: {
				"X-Thread-ID": stateId,
				...(channel.email.in_reply_to_message_id && {
					"In-Reply-To": channel.email.in_reply_to_message_id,
				}),
				...(channel.email.references_message_id && {
					References: channel.email.references_message_id,
				}),
			},
		} as const;

		const result = await resend.emails.send(emailData as any);
		if ((result as any).error) {
			throw new Error(`Resend error: ${(result as any).error.message}`);
		}

		return {
			success: true,
			channelType: "email",
			messageId: (result as any).data?.id || "unknown",
			timestamp: new Date().toISOString(),
		};
	} catch (error) {
		return {
			success: false,
			channelType: "email",
			messageId: "error",
			error: error instanceof Error ? error.message : "Unknown error",
			timestamp: new Date().toISOString(),
		};
	}
}
