// Email-related schemas
import { z } from 'zod';

export const EmailPayloadSchema = z.object({
  from_address: z.string(),
  to_address: z.string(),
  subject: z.string(),
  body: z.string(),
  message_id: z.string(),
  previous_thread: z.any().optional(),
});

export const EmailContactChannelSchema = z.object({
  email: z.object({
    address: z.string(),
    subject: z.string().optional(),
    in_reply_to_message_id: z.string().optional(),
    references_message_id: z.string().optional(),
  }),
});

// Export inferred types
export type EmailPayload = z.infer<typeof EmailPayloadSchema>;
export type EmailContactChannel = z.infer<typeof EmailContactChannelSchema>;
