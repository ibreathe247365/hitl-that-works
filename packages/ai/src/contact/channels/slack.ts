import type { WebhookPayload } from "../../schemas";
import type {
	RecipientInfo,
	SlackContactChannel,
	SlackContactResult,
} from "../types";

export async function sendSlack(
	message: string,
	channel: SlackContactChannel,
	stateId: string,
	_recipientInfo?: RecipientInfo,
): Promise<SlackContactResult> {
	try {
		const webhookUrl = process.env.SLACK_INCOMING_WEBHOOK_URL;
		if (!webhookUrl) {
			throw new Error("Missing SLACK_INCOMING_WEBHOOK_URL env var");
		}

		const payload = {
			text: `${message}\n\n_Thread ID: ${stateId}_`,
		} as const;

		const res = await fetch(webhookUrl, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		});

		if (!res.ok) {
			const text = await res.text().catch(() => "");
			throw new Error(`Slack webhook error: ${res.status} ${text}`);
		}

		return {
			success: true,
			channelType: "slack",
			messageId: `${Date.now()}`,
			channelId: channel.slack.channel_id,
			timestamp: new Date().toISOString(),
		};
	} catch (error) {
		return {
			success: false,
			channelType: "slack",
			messageId: "error",
			channelId: channel.slack.channel_id,
			error: error instanceof Error ? error.message : "Unknown error",
			timestamp: new Date().toISOString(),
		};
	}
}

export function createSlackWebhookPayload(slackEvent: any): WebhookPayload {
	const message =
		slackEvent.event?.text || slackEvent.text || "Slack response received";

	let stateId: string | undefined;

	if (slackEvent.event?.metadata?.event_payload?.stateId) {
		stateId = slackEvent.event.metadata.event_payload.stateId;
	}

	if (!stateId && slackEvent.event?.text) {
		const threadIdMatch = slackEvent.event.text.match(
			/_Thread ID: ([a-zA-Z0-9_-]+)_/,
		);
		if (threadIdMatch) {
			stateId = threadIdMatch[1];
		}
	}

	return {
		type: "human_contact.completed",
		event: {
			status: {
				response: message,
			},
			state: {
				stateId: stateId || "unknown",
			},
		},
	};
}

/**
 * Send a Slack approval request using an Incoming Webhook URL with URL buttons.
 * Falls back to posting plain text if blocks fail.
 */
export async function sendSlackFunctionApprovalRequest(
	message: string,
	channel: SlackContactChannel,
	stateId: string,
	fn: string,
	kwargs: any,
): Promise<SlackContactResult> {
	try {
		const webhookUrl = process.env.SLACK_INCOMING_WEBHOOK_URL;
		if (!webhookUrl) {
			throw new Error("Missing SLACK_INCOMING_WEBHOOK_URL env var");
		}

		const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "";
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

		const payload = {
			text: message,
			blocks: [
				{
					type: "section",
					text: {
						type: "mrkdwn",
						text: `${message}\n\n_Thread ID: ${stateId}_`,
					},
				},
				{
					type: "actions",
					elements: [
						{
							type: "button",
							text: { type: "plain_text", text: "Approve" },
							style: "primary",
							url: approveUrl,
						},
						{
							type: "button",
							text: { type: "plain_text", text: "Deny" },
							style: "danger",
							url: denyUrl,
						},
						{
							type: "button",
							text: { type: "plain_text", text: "Custom…" },
							url: customUrl,
						},
					],
				},
			],
		} as const;

		const res = await fetch(webhookUrl, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		});

		if (!res.ok) {
			const text = await res.text().catch(() => "");
			throw new Error(`Slack webhook error: ${res.status} ${text}`);
		}

		return {
			success: true,
			channelType: "slack",
			messageId: `${Date.now()}`,
			channelId: (channel as any)?.slack?.channel_id || "webhook",
			timestamp: new Date().toISOString(),
		};
	} catch (error) {
		return {
			success: false,
			channelType: "slack",
			messageId: "error",
			channelId: (channel as any)?.slack?.channel_id || "webhook",
			error: error instanceof Error ? error.message : "Unknown error",
			timestamp: new Date().toISOString(),
		};
	}
}
