import { z } from "zod";

export const MessagePayloadSchema = z.object({
	message: z.string().optional(),
	text: z.string().optional(),
	timestamp: z.string().optional(),
});

export const OperationMetadataShape = {
	status: z.enum(["queued", "in_progress", "succeeded", "failed"]).optional(),
	operationId: z.string().optional(),
	parentOperationId: z.string().optional(),
	startedAt: z.string().optional(),
	endedAt: z.string().optional(),
	durationMs: z.number().optional(),
	source: z.enum(["queue", "ai", "tool", "webhook", "system"]).optional(),
	payload: z.any().optional(),
} as const;
export const OperationMetadataSchema = z.object(OperationMetadataShape);

export const CallResultShape = {
	result: z.any().optional(),
	output: z.any().optional(),
	error: z.string().optional(),
} as const;
export const CallResultSchema = z.object(CallResultShape);

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
	data: MessagePayloadSchema,
});

export const AIResponseEventSchema = z.object({
	type: z.literal("ai_response"),
	data: MessagePayloadSchema,
});

export const AssistantMessageEventSchema = z.object({
	type: z.literal("assistant_message"),
	data: MessagePayloadSchema,
});

export const ToolCallEventSchema = z.object({
	type: z.literal("tool_call"),
	data: z
		.object({
			name: z.string().optional(),
			arguments: z.any().optional(),
			input: z.any().optional(),
		})
		.extend(CallResultShape)
		.extend(OperationMetadataShape),
});

export const FunctionCallEventSchema = z.object({
	type: z.literal("function_call"),
	data: z
		.object({
			function_name: z.string().optional(),
			name: z.string().optional(),
			arguments: z.any().optional(),
			input: z.any().optional(),
		})
		.extend(CallResultShape)
		.extend(OperationMetadataShape),
});

export const WebhookProcessedEventSchema = z.object({
	type: z.literal("webhook_processed"),
	data: z
		.object({
			payloadType: z.string(),
			timestamp: z.string().optional(),
		})
		.extend(OperationMetadataShape)
		.extend({
			result: z.any().optional(),
			error: z
				.object({
					message: z.string(),
					stack: z.string().optional(),
					code: z.string().optional(),
				})
				.optional(),
		}),
});

export const ThreadCreatedEventSchema = z.object({
    type: z.literal("thread_created"),
    data: z.object({
        message: z.string(),
        userId: z.string(),
    }),
});

export const WebhookReceivedEventSchema = z.object({
    type: z.literal("webhook_received"),
    data: z.object({
        jobId: z.string(),
        payloadType: z.string(),
        receivedAt: z.string(),
        source: z.string(),
    }),
});

export const WebhookOperationEventSchema = z.object({
    type: z.literal("webhook"),
    data: z
        .object({
            name: z.string(),
            payload: z.any().optional(),
            result: z.any().optional(),
        })
        .extend(OperationMetadataShape),
});

export const QueueEventSchema = z.object({
    type: z.literal("queue"),
    data: z
        .object({
            name: z.string(),
            payload: z.any().optional(),
            result: z.any().optional(),
        })
        .extend(OperationMetadataShape),
});

// AI step operation
export const AIStepEventSchema = z.object({
    type: z.literal("ai_step"),
    data: z
        .object({
            name: z.string(),
            payload: z.any().optional(),
            result: z.any().optional(),
        })
        .extend(OperationMetadataShape),
});

// Intent (raw) events
export const CalculateIntentEventSchema = z.object({
    type: z.literal("calculate"),
    data: z.object({
        intent: z.literal("calculate"),
        expression: z.string(),
        explanation: z.string().optional(),
    }),
});

export const DoneForNowIntentEventSchema = z.object({
    type: z.literal("done_for_now"),
    data: z.object({
        intent: z.literal("done_for_now"),
        message: z.string(),
    }),
});

export const NothingToDoIntentEventSchema = z.object({
    type: z.literal("nothing_to_do"),
    data: z.object({
        intent: z.literal("nothing_to_do"),
        message: z.string(),
    }),
});

// Tool/intent result events
export const CalculateResultEventSchema = z.object({
    type: z.literal("calculate_result"),
    data: z.object({
        expression: z.string(),
        result: z.number(),
        steps: z.array(z.string()).optional(),
        formatted: z.string().optional(),
        explanation: z.string().optional(),
    }),
});

// Error and contact events
export const ErrorEventSchema = z.object({
    type: z.literal("error"),
    data: z.string(),
});

export const HumanContactSentEventSchema = z.object({
    type: z.literal("human_contact_sent"),
    data: z.any(),
});

export const RollbackAgentEventSchema = z.object({
	type: z.literal("rollback-agent"),
	data: z.object({
		message: z.string(),
		timestamp: z.string().optional(),
	}),
});

export const GenericEventSchema = z.object({
	type: z.string(),
	data: z.any(),
});

export const EventSchema = z.union([
    ThreadCreatedEventSchema,
	HumanResponseEventSchema,
	RequestMoreInformationEventSchema,
	UserMessageEventSchema,
	AIResponseEventSchema,
	AssistantMessageEventSchema,
    ErrorEventSchema,
    WebhookReceivedEventSchema,
    WebhookOperationEventSchema,
    QueueEventSchema,
    AIStepEventSchema,
	ToolCallEventSchema,
	FunctionCallEventSchema,
	WebhookProcessedEventSchema,
    CalculateIntentEventSchema,
    DoneForNowIntentEventSchema,
    NothingToDoIntentEventSchema,
    HumanContactSentEventSchema,
    CalculateResultEventSchema,
	RollbackAgentEventSchema,
	GenericEventSchema,
]);

export const ThreadSchema = z.object({
	initial_email: z.any().optional(),
	events: z.array(EventSchema).min(0, "Events array is required"),
});

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
export type RollbackAgentEvent = z.infer<typeof RollbackAgentEventSchema>;
export type GenericEvent = z.infer<typeof GenericEventSchema>;
export type ThreadCreatedEvent = z.infer<typeof ThreadCreatedEventSchema>;
export type WebhookReceivedEvent = z.infer<typeof WebhookReceivedEventSchema>;
export type WebhookOperationEvent = z.infer<typeof WebhookOperationEventSchema>;
export type QueueEvent = z.infer<typeof QueueEventSchema>;
export type AIStepEvent = z.infer<typeof AIStepEventSchema>;
export type CalculateIntentEvent = z.infer<typeof CalculateIntentEventSchema>;
export type DoneForNowIntentEvent = z.infer<typeof DoneForNowIntentEventSchema>;
export type NothingToDoIntentEvent = z.infer<typeof NothingToDoIntentEventSchema>;
export type CalculateResultEvent = z.infer<typeof CalculateResultEventSchema>;
export type ErrorEvent = z.infer<typeof ErrorEventSchema>;
export type HumanContactSentEvent = z.infer<typeof HumanContactSentEventSchema>;
