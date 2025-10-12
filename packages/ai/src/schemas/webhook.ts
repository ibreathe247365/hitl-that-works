// Webhook payload schemas for human responses
import { z } from "zod";

export const HumanContactCompletedSchema = z.object({
	type: z.literal("human_contact.completed"),
	event: z.object({
		status: z
			.object({
				response: z.string().optional(),
			})
			.optional(),
		state: z
			.object({
				stateId: z.string().optional(),
			})
			.optional(),
	}),
});

export const FunctionCallCompletedSchema = z.object({
	type: z.literal("function_call.completed"),
	event: z.object({
		spec: z.object({
			fn: z.string(),
			kwargs: z.any(),
			state: z
				.object({
					stateId: z.string().optional(),
				})
				.optional(),
		}),
		status: z
			.object({
				approved: z.boolean().optional(),
				comment: z.string().optional(),
			})
			.optional(),
	}),
});

// Unified webhook payload schema
export const WebhookPayloadSchema = z.union([
	HumanContactCompletedSchema,
	FunctionCallCompletedSchema,
]);

// Export inferred types
export type HumanContactCompleted = z.infer<typeof HumanContactCompletedSchema>;
export type FunctionCallCompleted = z.infer<typeof FunctionCallCompletedSchema>;
export type WebhookPayload = z.infer<typeof WebhookPayloadSchema>;
