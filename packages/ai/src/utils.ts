import * as yaml from "js-yaml";
import type {
	EmailPayload,
	Event,
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
