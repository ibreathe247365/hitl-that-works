// Main contact system - unified interface for all contact channels

import { sendEmail } from "./channels/email";
import { sendSlack, sendSlackFunctionApprovalRequest } from "./channels/slack";
import { sendWebhook } from "./channels/webhook";
import type {
	ContactChannel,
	ContactDelivery,
	ContactResult,
	RecipientInfo,
} from "./types";

// Re-export channel-specific functions
export { createEmailWebhookPayload, sendEmail } from "./channels/email";
export {
	createSlackWebhookPayload,
	sendSlack,
	sendSlackFunctionApprovalRequest,
} from "./channels/slack";
export { sendWebhook } from "./channels/webhook";
export * from "./schemas";
// Re-export all types and schemas
export * from "./types";

/**
 * Send a message via one or more contact channels
 * @param message The message to send
 * @param channels Single channel or array of channels to send to
 * @param stateId Thread state ID for tracking
 * @param recipientInfo Optional recipient information
 * @returns Promise<ContactDelivery> with results from all channels
 */
export async function createHumanContact(
	message: string,
	channels: ContactChannel | ContactChannel[],
	stateId: string,
	recipientInfo?: RecipientInfo,
): Promise<ContactDelivery> {
	const channelArray = Array.isArray(channels) ? channels : [channels];
	const results: ContactResult[] = [];

	const promises = channelArray.map(async (channel) => {
		try {
			if ("email" in channel) {
				return await sendEmail(message, channel, stateId, recipientInfo);
			}
			if ("slack" in channel) {
				return await sendSlack(message, channel, stateId, recipientInfo);
			}
			if ("webhook" in channel) {
				return await sendWebhook(message, channel, stateId);
			}
			throw new Error(`Unknown channel type: ${JSON.stringify(channel)}`);
		} catch (error) {
			return {
				success: false,
				channelType: "webhook" as const, // fallback
				error: error instanceof Error ? error.message : "Unknown error",
				timestamp: new Date().toISOString(),
			};
		}
	});

	const channelResults = await Promise.all(promises);
	results.push(...channelResults);

	return {
		stateId,
		results,
		timestamp: new Date().toISOString(),
	};
}
