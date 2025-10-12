import * as yaml from "js-yaml";
import type {
	ContactChannel,
	EmailPayload,
	Event,
	HumanContactRequest,
	Thread,
} from "./schemas";

export function stringifyToYaml(obj: any): string {
	if (!obj) {
		return "undefined";
	}

	const replacer = (_key: string, value: any) => {
		if (typeof value === "function") {
			return undefined;
		}
		return value;
	};

	const plainObj = JSON.parse(JSON.stringify(obj, replacer));

	return yaml.dump(plainObj, {
		skipInvalid: true,
		noRefs: true,
	});
}

export const eventToPrompt = (event: Event) => {
	switch (event.type) {
		case "email_received": {
			const email = event.data as EmailPayload;
			return `<${event.type}>
            From: ${email.from_address}
            To: ${email.to_address}
            Subject: ${email.subject}
            Body: ${email.body}
            Previous Thread: ${stringifyToYaml(email.previous_thread)}
</${event.type}>
        `;
		}
		default: {
			const data =
				typeof event.data !== "string"
					? stringifyToYaml(event.data)
					: event.data;
			return `<${event.type}>
          ${data}
</${event.type}>
      `;
		}
	}
};

export const threadToPrompt = (thread: Thread) => {
	return thread.events.map(eventToPrompt).join("\n\n");
};

// Helper function to create email contact channel
export const createEmailContactChannel = (
	email: EmailPayload,
): ContactChannel => {
	return {
		email: {
			address: email.from_address,
			subject: email.subject,
			in_reply_to_message_id: email.message_id,
			references_message_id: email.message_id,
		},
	};
};

// Helper function to process human contact requests
export const processHumanContactRequest = (
	request: HumanContactRequest,
): void => {
	console.log(`Human contact request: ${request.message}`);
	console.log(`Contact method: ${request.contact_method}`);
	console.log(`State: ${JSON.stringify(request.state)}`);

	// Here you would implement the actual contact logic based on the method
	// For now, we just log the request
	switch (request.contact_method) {
		case "email":
			console.log(`Would send email to: ${request.message}`);
			break;
		case "webhook":
			console.log(`Would send webhook: ${request.message}`);
			break;
		default:
			console.log(`Unknown contact method: ${request.contact_method}`);
	}
};
