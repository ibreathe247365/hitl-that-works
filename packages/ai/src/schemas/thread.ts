// Thread and event-related schemas
import { z } from 'zod';

export const EventSchema = z.object({
  type: z.string(),
  data: z.any(), // We'll keep this flexible for now since it can be many different types
});

export const ThreadSchema = z.object({
  initial_email: z.any().optional(),
  events: z.array(EventSchema).min(0, 'Events array is required'),
});

// Export inferred types
export type Event = z.infer<typeof EventSchema>;
export type Thread = z.infer<typeof ThreadSchema>;
