// Webhook contact channel implementation
import type { WebhookContactChannel, WebhookContactResult } from "../types";

export async function sendWebhook(
	message: string,
	channel: WebhookContactChannel,
	stateId: string,
): Promise<WebhookContactResult> {
	try {
		const payload = {
			message,
			stateId,
			timestamp: new Date().toISOString(),
			source: "ai_agent",
		};

		const response = await fetch(channel.webhook.url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				...channel.webhook.headers,
			},
			body: JSON.stringify(payload),
		});

		const responseData = await response.text();
		let parsedData: any;
		
		try {
			parsedData = JSON.parse(responseData);
		} catch {
			parsedData = responseData;
		}

		if (!response.ok) {
			throw new Error(`Webhook error: ${response.status} ${response.statusText}`);
		}

		return {
			success: true,
			channelType: "webhook",
			responseStatus: response.status,
			responseData: parsedData,
			timestamp: new Date().toISOString(),
		};
	} catch (error) {
		return {
			success: false,
			channelType: "webhook",
			error: error instanceof Error ? error.message : "Unknown error",
			timestamp: new Date().toISOString(),
		};
	}
}
