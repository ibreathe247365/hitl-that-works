import {
	type Await,
	b,
	type ClarificationRequest,
	type DoneForNow,
	type IntentCalculate,
	type NothingToDo,
} from "./baml_client";
import { createHumanContact } from "./contact";
import type {
	EmailPayload,
	Event,
	FunctionCallCompleted,
	HumanContactCompleted,
	Thread,
	WebhookPayload,
} from "./schemas";
import { saveThreadState } from "./state";
import {
	evaluateExpression,
	formatCalculationResult,
	validateMathematicalExpression,
} from "./tools/calculator";
import { threadToPrompt } from "./utils";

// Define specific kwargs types for known function handlers
type VercelDeploymentKwargs = {
	new_deployment: string;
	previous_deployment: string;
};

type TagPushProdKwargs = {
	new_commit: string;
	previous_commit: string;
};

type FunctionKwargs = VercelDeploymentKwargs | TagPushProdKwargs;

const functionHandlers: Record<
	string,
	(thread: Thread, kwargs: FunctionKwargs) => Promise<Thread>
> = {
	promote_vercel_deployment: async (thread, kwargs) => {
		const typedKwargs = kwargs as VercelDeploymentKwargs;
		console.log(`promoting vercel deployment: ${typedKwargs.new_deployment}`);
		console.log(`previous deployment: ${typedKwargs.previous_deployment}`);
		return await appendResult(thread, async () => ({
			status: "vercel deployment promotion not implemented yet",
		}));
	},
	tag_push_prod: async (thread, kwargs) => {
		const typedKwargs = kwargs as TagPushProdKwargs;
		console.log(`tagging and pushing to prod: ${typedKwargs.new_commit}`);
		console.log(`previous commit: ${typedKwargs.previous_commit}`);
		return await appendResult(thread, async () => ({
			status: "tag and push to prod not implemented yet",
		}));
	},
};

// Helper function to extract email address from thread
const getEmailFromThread = (thread: Thread): string | null => {
	// First try to get from initial_email
	if (thread.initial_email) {
		const email = thread.initial_email as EmailPayload;
		if (email.from_address) {
			return email.from_address;
		}
	}

	// Fallback: look for email_received event in thread events
	const emailEvent = thread.events.find(
		(event) => event.type === "email_received",
	);
	if (emailEvent) {
		const email = emailEvent.data as EmailPayload;
		if (email.from_address) {
			return email.from_address;
		}
	}

	return null;
};

const appendResult = async (
	thread: Thread,
	fn: () => Promise<Record<string, unknown>>,
): Promise<Thread> => {
	const lastEvent: Event | undefined = thread.events.slice(-1)[0];
	if (!lastEvent) {
		thread.events.push({
			type: "error",
			data: "No events found in thread - something is wrong with your internal programming, please get help from a human",
		});
		return thread;
	}
	const responseType: string = `${lastEvent.type}_result`;
	if (!responseType) {
		thread.events.push({
			type: "error",
			data: `No response type found for ${lastEvent.type} - something is wrong with your internal programming, please get help from a human`,
		});
		return thread;
	}
	try {
		const result = await fn();
		thread.events.push({
			type: responseType,
			data: result,
		});
	} catch (e) {
		console.error(e);
		const errorEvent = await b.SquashResponseContext(
			threadToPrompt(thread),
			`error running ${thread.events.slice(-1)[0]?.type}: ${e}`,
		);
		thread.events.push({
			type: "error",
			data: errorEvent,
		});
	}
	return thread;
};

const _handleNextStep = async (
	thread: Thread,
	nextStep:
		| ClarificationRequest
		| DoneForNow
		| IntentCalculate
		| NothingToDo
		| Await,
	stateId?: string,
): Promise<Thread | false> => {
	thread.events.push({
		type: nextStep.intent,
		data: nextStep,
	});
	let currentStateId: string | null = null;
	switch (nextStep.intent) {
		case "done_for_now": {
			currentStateId = await saveThreadState(thread, undefined, undefined, stateId);

			// Get email address from thread
			const emailAddress = getEmailFromThread(thread);
			if (!emailAddress) {
				console.error("No email address found in thread for contact");
				thread.events.push({
					type: "error",
					data: "No email address found in thread for human contact",
				});
				return false;
			}

			// Send human contact via email
			const contactDelivery = await createHumanContact(
				nextStep.message,
				{
					email: {
						address: emailAddress,
						subject: "AI Agent Task Completed",
					},
				},
				currentStateId,
			);

			// Add contact delivery result to thread events
			thread.events.push({
				type: "human_contact_sent",
				data: contactDelivery,
			});

			console.log(`Task completed - ${nextStep.message}`);
			return false;
		}

		case "request_more_information": {
			currentStateId = await saveThreadState(thread, undefined, undefined, stateId);

			// Get email address from thread
			const emailAddress = getEmailFromThread(thread);
			if (!emailAddress) {
				console.error("No email address found in thread for contact");
				thread.events.push({
					type: "error",
					data: "No email address found in thread for human contact",
				});
				return false;
			}

			// Send human contact via email
			const contactDelivery = await createHumanContact(
				nextStep.message,
				{
					email: {
						address: emailAddress,
						subject: "AI Agent Needs Clarification",
					},
				},
				currentStateId,
			);

			// Add contact delivery result to thread events
			thread.events.push({
				type: "human_contact_sent",
				data: contactDelivery,
			});

			console.log(`Requesting clarification - ${nextStep.message}`);
			return false;
		}

		case "nothing_to_do":
			currentStateId = await saveThreadState(thread, undefined, undefined, stateId);

			return false;

		case "await":
			console.log(
				`awaiting ${nextStep.seconds} seconds, reasoning: ${nextStep.reasoning}`,
			);
			return await appendResult(thread, async () => {
				await new Promise((resolve) =>
					setTimeout(resolve, nextStep.seconds * 1000),
				);
				return {
					status: `successfully waited ${nextStep.seconds} seconds`,
				};
			});

		case "calculate":
			return await appendResult(thread, async () => {
				// Validate the expression first
				const validation = validateMathematicalExpression(nextStep.expression);
				if (!validation.isValid) {
					return {
						expression: nextStep.expression,
						result: 0,
						error: validation.error,
						explanation: nextStep.explanation,
					};
				}

				// Perform the calculation
				const calculationResult = evaluateExpression(nextStep.expression);

				const result = {
					expression: nextStep.expression,
					result: calculationResult.result,
					steps: calculationResult.steps,
					error: calculationResult.error,
					explanation: nextStep.explanation,
				};

				return {
					...result,
					formatted: formatCalculationResult(calculationResult),
				};
			});

		default:
			thread.events.push({
				type: "error",
				data: `you called a tool that is not implemented: ${(nextStep as any).intent}, something is wrong with your internal programming, please get help from a human`,
			});
			return thread;
	}
};

export const handleNextStep = async (
	thread: Thread,
	stateId?: string,
): Promise<void> => {
	console.log(`thread: ${JSON.stringify(thread)}`);

	let nextThread: Thread | false = thread;

	while (true) {
		const nextStep = await b.DetermineNextStep(threadToPrompt(nextThread));

		console.log("===============");
		console.log(threadToPrompt(thread));
		console.log(nextStep);
		console.log("===============");

		nextThread = await _handleNextStep(thread, nextStep, stateId);
		if (!nextThread) {
			break;
		}
	}
};

// Helper functions for handling different payload types
const handleHumanContactCompleted = async (
	thread: Thread,
	payload: HumanContactCompleted,
	stateId?: string,
): Promise<void> => {
	thread.events.push({
		type: "human_response",
		data: payload.event.status?.response || "No response provided",
	});

	return await handleNextStep(thread, stateId);
};

const handleFunctionCallCompleted = async (
	thread: Thread,
	payload: FunctionCallCompleted,
	stateId?: string,
): Promise<void> => {
	// Handle rejection
	if (!payload.event.status?.approved) {
		thread.events.push({
			type: "human_response",
			data: `User denied ${payload.event.spec.fn} with feedback: ${
				payload.event.status?.comment || "(No comment provided)"
			}`,
		});
		return await handleNextStep(thread, stateId);
	}

	const handler = functionHandlers[payload.event.spec.fn];
	if (handler) {
		const updatedThread = await handler(thread, payload.event.spec.kwargs);
		return await handleNextStep(updatedThread, stateId);
	}

	// Unknown function
	thread.events.push({
		type: "error",
		data: `Unknown intent: ${payload.event.spec.fn}`,
	});
	return await handleNextStep(thread, stateId);
};

export const handleHumanResponse = async (
	thread: Thread,
	payload: WebhookPayload,
	stateId?: string,
): Promise<void> => {
	switch (payload.type) {
		case "human_contact.completed":
			return await handleHumanContactCompleted(
				thread,
				payload as HumanContactCompleted,
				stateId,
			);
		case "function_call.completed":
			return await handleFunctionCallCompleted(
				thread,
				payload as FunctionCallCompleted,
				stateId,
			);
		default:
			throw new Error(`Unknown payload type: ${(payload as any).type}`);
	}
};
