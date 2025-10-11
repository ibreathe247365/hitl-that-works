// Human contact and communication schemas
import { z } from 'zod';
import { EmailContactChannelSchema } from './email';

export const HumanContactRequestSchema = z.object({
  type: z.literal('human_contact_request'),
  message: z.string().min(1, 'Message cannot be empty'),
  contact_method: z.enum(['email', 'webhook']),
  state: z.any().optional(),
});

export const HumanContactResponseSchema = z.object({
  type: z.literal('human_contact_response'),
  message: z.string().min(1, 'Message cannot be empty'),
  contact_method: z.enum(['email', 'webhook']),
});

export const WebhookContactChannelSchema = z.object({
  webhook: z.object({
    url: z.string(),
    headers: z.record(z.string(), z.string()).optional(),
  }),
});

// Contact channel union type
export const ContactChannelSchema = z.union([
  EmailContactChannelSchema,
  WebhookContactChannelSchema,
]);

// Export inferred types
export type HumanContactRequest = z.infer<typeof HumanContactRequestSchema>;
export type HumanContactResponse = z.infer<typeof HumanContactResponseSchema>;
export type WebhookContactChannel = z.infer<typeof WebhookContactChannelSchema>;
export type ContactChannel = z.infer<typeof ContactChannelSchema>;

// Helper function for creating human contact requests
export function createHumanContactRequest(
  message: string, 
  contactMethod: 'email' | 'webhook' = 'email',
  state?: any
): HumanContactRequest {
  return {
    type: 'human_contact_request',
    message,
    contact_method: contactMethod,
    state,
  };
}
