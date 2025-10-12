import { z } from "zod";

export const HumanContactRequestSchema = z.object({
	type: z.literal("human_contact_request"),
	message: z.string().min(1, "Message cannot be empty"),
	contact_method: z.enum(["email", "webhook"]),
	state: z.any().optional(),
});

export type HumanContactRequest = z.infer<typeof HumanContactRequestSchema>;

// Helper function for creating human contact requests
export function createHumanContactRequest(
	message: string,
	contactMethod: "email" | "webhook" = "email",
	state?: any,
): HumanContactRequest {
	return {
		type: "human_contact_request",
		message,
		contact_method: contactMethod,
		state,
	};
}
