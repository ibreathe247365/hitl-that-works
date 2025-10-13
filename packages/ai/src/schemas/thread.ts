// Thread and event-related schemas
import { z } from "zod";

// Define specific event types based on common patterns
export const HumanResponseEventSchema = z.object({
	type: z.literal("human_response"),
	data: z.string(),
});

export const RequestMoreInformationEventSchema = z.object({
	type: z.literal("request_more_information"),
	data: z.object({
		intent: z.string(),
		message: z.string(),
	}),
});

export const UserMessageEventSchema = z.object({
	type: z.literal("user_message"),
	data: z.object({
		message: z.string().optional(),
		text: z.string().optional(),
		timestamp: z.string().optional(),
	}),
});

export const AIResponseEventSchema = z.object({
	type: z.literal("ai_response"),
	data: z.object({
		message: z.string().optional(),
		text: z.string().optional(),
		timestamp: z.string().optional(),
	}),
});

export const AssistantMessageEventSchema = z.object({
	type: z.literal("assistant_message"),
	data: z.object({
		message: z.string().optional(),
		text: z.string().optional(),
		timestamp: z.string().optional(),
	}),
});

export const ToolCallEventSchema = z.object({
	type: z.literal("tool_call"),
	data: z.object({
		name: z.string().optional(),
		arguments: z.any().optional(),
		input: z.any().optional(),
		result: z.any().optional(),
		output: z.any().optional(),
		error: z.string().optional(),
	}),
});

export const FunctionCallEventSchema = z.object({
	type: z.literal("function_call"),
	data: z.object({
		function_name: z.string().optional(),
		name: z.string().optional(),
		arguments: z.any().optional(),
		input: z.any().optional(),
		result: z.any().optional(),
		output: z.any().optional(),
		error: z.string().optional(),
	}),
});

export const WebhookProcessedEventSchema = z.object({
	type: z.literal("webhook_processed"),
	data: z.object({
		payloadType: z.string(),
		timestamp: z.string().optional(),
	}),
});

export const GenericEventSchema = z.object({
	type: z.string(),
	data: z.any(),
});

// Union of all possible event types
export const EventSchema = z.union([
	HumanResponseEventSchema,
	RequestMoreInformationEventSchema,
	UserMessageEventSchema,
	AIResponseEventSchema,
	AssistantMessageEventSchema,
	ToolCallEventSchema,
	FunctionCallEventSchema,
	WebhookProcessedEventSchema,
	GenericEventSchema,
]);

export const ThreadSchema = z.object({
	initial_email: z.any().optional(),
	events: z.array(EventSchema).min(0, "Events array is required"),
});

// Export inferred types
export type Event = z.infer<typeof EventSchema>;
export type Thread = z.infer<typeof ThreadSchema>;
export type HumanResponseEvent = z.infer<typeof HumanResponseEventSchema>;
export type RequestMoreInformationEvent = z.infer<
	typeof RequestMoreInformationEventSchema
>;
export type UserMessageEvent = z.infer<typeof UserMessageEventSchema>;
export type AIResponseEvent = z.infer<typeof AIResponseEventSchema>;
export type AssistantMessageEvent = z.infer<typeof AssistantMessageEventSchema>;
export type ToolCallEvent = z.infer<typeof ToolCallEventSchema>;
export type FunctionCallEvent = z.infer<typeof FunctionCallEventSchema>;
export type WebhookProcessedEvent = z.infer<typeof WebhookProcessedEventSchema>;
export type GenericEvent = z.infer<typeof GenericEventSchema>;
