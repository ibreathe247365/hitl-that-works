import { serve } from "inngest/next";
import { processWebhook } from "@/inngest/functions/processWebhook";
import { inngest } from "@/lib/inngest";

export const { GET, POST, PUT } = serve({
	client: inngest,
	functions: [processWebhook],
});
