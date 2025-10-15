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
