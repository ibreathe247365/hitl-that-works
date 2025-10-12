// Contact channel schemas
import { z } from "zod";

// Email contact channel schema
export const EmailContactChannelSchema = z.object({
	email: z.object({
		address: z.string().email(),
		subject: z.string().optional(),
		in_reply_to_message_id: z.string().optional(),
		references_message_id: z.string().optional(),
	}),
});

// Slack contact channel schema
export const SlackContactChannelSchema = z.object({
	slack: z.object({
		channel_id: z.string(),
		user_id: z.string().optional(),
		thread_ts: z.string().optional(),
	}),
});

// Webhook contact channel schema
export const WebhookContactChannelSchema = z.object({
	webhook: z.object({
		url: z.string().url(),
		headers: z.record(z.string(), z.string()).optional(),
	}),
});

// Union of all contact channel types
export const ContactChannelSchema = z.union([
	EmailContactChannelSchema,
	SlackContactChannelSchema,
	WebhookContactChannelSchema,
]);

// Array schema for multi-channel sending
export const ContactChannelsArraySchema = z.array(ContactChannelSchema);

// Export inferred types
export type EmailContactChannel = z.infer<typeof EmailContactChannelSchema>;
export type SlackContactChannel = z.infer<typeof SlackContactChannelSchema>;
export type WebhookContactChannel = z.infer<typeof WebhookContactChannelSchema>;
export type ContactChannel = z.infer<typeof ContactChannelSchema>;
export type ContactChannelsArray = z.infer<typeof ContactChannelsArraySchema>;
