// Contact system types
export interface ContactResult {
	success: boolean;
	channelType: ContactChannelType;
	messageId?: string;
	error?: string;
	timestamp: string;
}

export interface RecipientInfo {
	email?: string;
	slackUserId?: string;
	name?: string;
}

export interface ContactDelivery {
	stateId: string;
	results: ContactResult[];
	timestamp: string;
}

export type ContactChannelType = "email" | "slack" | "webhook";

// Channel-specific result types
export interface EmailContactResult extends ContactResult {
	channelType: "email";
	messageId: string; // Resend message ID
}

export interface SlackContactResult extends ContactResult {
	channelType: "slack";
	messageId: string; // Slack message timestamp
	channelId: string;
}

export interface WebhookContactResult extends ContactResult {
	channelType: "webhook";
	responseStatus?: number;
	responseData?: any;
}

// Re-export channel types from schemas
export type { 
	EmailContactChannel, 
	SlackContactChannel, 
	WebhookContactChannel,
	ContactChannel 
} from "./schemas";
