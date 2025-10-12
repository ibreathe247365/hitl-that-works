// Main contact system - unified interface for all contact channels
import type { 
	ContactChannel, 
	ContactDelivery, 
	RecipientInfo,
	ContactResult 
} from "./types";
import { sendEmail } from "./channels/email";
import { sendSlack } from "./channels/slack";
import { sendWebhook } from "./channels/webhook";

// Re-export all types and schemas
export * from "./types";
export * from "./schemas";

// Re-export channel-specific functions
export { sendEmail, createEmailWebhookPayload } from "./channels/email";
export { sendSlack, createSlackWebhookPayload } from "./channels/slack";
export { sendWebhook } from "./channels/webhook";

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

	// Send to all channels in parallel
	const promises = channelArray.map(async (channel) => {
		try {
			if ("email" in channel) {
				return await sendEmail(message, channel, stateId, recipientInfo);
			} else if ("slack" in channel) {
				return await sendSlack(message, channel, stateId, recipientInfo);
			} else if ("webhook" in channel) {
				return await sendWebhook(message, channel, stateId);
			} else {
				throw new Error(`Unknown channel type: ${JSON.stringify(channel)}`);
			}
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
