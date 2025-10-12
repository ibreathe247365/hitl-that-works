import {
	type Await,
	b,
	type ClarificationRequest,
	type DoneForNow,
	type IntentCalculate,
	type NothingToDo,
} from "./baml_client";
import type {
	Event,
	FunctionCallCompleted,
	HumanContactCompleted,
	Thread,
	WebhookPayload,
} from "./schemas";
import { createHumanContactRequest } from "./schemas";
import { saveThreadState } from "./state";
import {
	evaluateExpression,
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
): Promise<Thread | false> => {
	thread.events.push({
		type: nextStep.intent,
		data: nextStep,
	});
	let stateId: string | null = null;
	switch (nextStep.intent) {
		case "done_for_now": {
			stateId = await saveThreadState(thread);

			// Create human contact request for email
			const doneContactRequest = createHumanContactRequest(
				nextStep.message,
				"email",
				{ stateId },
			);

			thread.events.push({
				type: "human_contact_request",
				data: doneContactRequest,
			});

			console.log(`Task completed - ${nextStep.message}`);
			return false;
		}

		case "request_more_information": {
			stateId = await saveThreadState(thread);

			// Create human contact request for email
			const clarificationContactRequest = createHumanContactRequest(
				nextStep.message,
				"email",
				{ stateId },
			);

			thread.events.push({
				type: "human_contact_request",
				data: clarificationContactRequest,
			});

			console.log(`Requesting clarification - ${nextStep.message}`);
			return false;
		}

		case "nothing_to_do":
			stateId = await saveThreadState(thread);

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

				return {
					expression: nextStep.expression,
					result: calculationResult.result,
					steps: calculationResult.steps,
					error: calculationResult.error,
					explanation: nextStep.explanation,
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

export const handleNextStep = async (thread: Thread): Promise<void> => {
	console.log(`thread: ${JSON.stringify(thread)}`);

	let nextThread: Thread | false = thread;

	while (true) {
		const nextStep = await b.DetermineNextStep(threadToPrompt(nextThread));

		console.log("===============");
		console.log(threadToPrompt(thread));
		console.log(nextStep);
		console.log("===============");

		nextThread = await _handleNextStep(thread, nextStep);
		if (!nextThread) {
			break;
		}
	}
};

// Helper functions for handling different payload types
const handleHumanContactCompleted = async (
	thread: Thread,
	payload: HumanContactCompleted,
): Promise<void> => {
	thread.events.push({
		type: "human_response",
		data: payload.event.status?.response || "No response provided",
	});

	return await handleNextStep(thread);
};

const handleFunctionCallCompleted = async (
	thread: Thread,
	payload: FunctionCallCompleted,
): Promise<void> => {
	// Handle rejection
	if (!payload.event.status?.approved) {
		thread.events.push({
			type: "human_response",
			data: `User denied ${payload.event.spec.fn} with feedback: ${
				payload.event.status?.comment || "(No comment provided)"
			}`,
		});
		return await handleNextStep(thread);
	}

	const handler = functionHandlers[payload.event.spec.fn];
	if (handler) {
		const updatedThread = await handler(thread, payload.event.spec.kwargs);
		return await handleNextStep(updatedThread);
	}

	// Unknown function
	thread.events.push({
		type: "error",
		data: `Unknown intent: ${payload.event.spec.fn}`,
	});
	return await handleNextStep(thread);
};

export const handleHumanResponse = async (
	thread: Thread,
	payload: WebhookPayload,
): Promise<void> => {
	switch (payload.type) {
		case "human_contact.completed":
			return await handleHumanContactCompleted(
				thread,
				payload as HumanContactCompleted,
			);
		case "function_call.completed":
			return await handleFunctionCallCompleted(
				thread,
				payload as FunctionCallCompleted,
			);
		default:
			throw new Error(`Unknown payload type: ${(payload as any).type}`);
	}
};
