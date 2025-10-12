// Slack contact channel implementation
import { WebClient } from "@slack/web-api";
import type { SlackContactChannel, SlackContactResult, RecipientInfo } from "../types";
import type { WebhookPayload } from "../../schemas";

const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

export async function sendSlack(
	message: string,
	channel: SlackContactChannel,
	stateId: string,
	_recipientInfo?: RecipientInfo,
): Promise<SlackContactResult> {
	try {
		const messageText = `${message}\n\n_Thread ID: ${stateId}_`;

		const result = await slack.chat.postMessage({
			channel: channel.slack.channel_id,
			text: messageText,
			thread_ts: channel.slack.thread_ts,
			metadata: {
				event_type: "ai_agent_message",
				event_payload: {
					stateId,
					channelType: "slack",
				},
			},
		});

		if (!result.ok) {
			throw new Error(`Slack API error: ${result.error}`);
		}

		return {
			success: true,
			channelType: "slack",
			messageId: result.ts || "unknown",
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
	// Extract message from Slack event
	const message = slackEvent.event?.text || slackEvent.text || "Slack response received";
	
	// Extract stateId from message metadata or thread metadata
	let stateId: string | undefined;
	
	// Try to extract from message metadata
	if (slackEvent.event?.metadata?.event_payload?.stateId) {
		stateId = slackEvent.event.metadata.event_payload.stateId;
	}
	
	// Try to extract from message text (fallback)
	if (!stateId && slackEvent.event?.text) {
		const threadIdMatch = slackEvent.event.text.match(/_Thread ID: ([a-zA-Z0-9_-]+)_/);
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
