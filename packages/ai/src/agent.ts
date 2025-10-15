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
	Event,
	FunctionCallCompleted,
	HumanContactCompleted,
	Thread,
	WebhookPayload,
} from "./schemas";
import { saveThreadState } from "./state";
import { failOperation, startOperation, succeedOperation } from "./sync";
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
	promote_vercel_deployment: async (thread, _kwargs) => {
			// const typedKwargs = kwargs as VercelDeploymentKwargs;

		return await appendResult(thread, async () => ({
			status: "vercel deployment promotion not implemented yet",
		}));
	},
	tag_push_prod: async (thread, _kwargs) => {
			// const typedKwargs = kwargs as TagPushProdKwargs;

		return await appendResult(thread, async () => ({
			status: "tag and push to prod not implemented yet",
		}));
	},
};

// Helper function to extract email address from thread
const getEmailFromThread = (_thread: Thread): string | null => {
	return "delivered@resend.dev";
	// First try to get from initial_email
	// if (thread.initial_email) {
	// 	const email = thread.initial_email as EmailPayload;
	// 	if (email.from_address) {
	// 		return email.from_address;
	// 	}
	// }

	// // Fallback: look for email_received event in thread events
	// const emailEvent = thread.events.find(
	// 	(event) => event.type === "email_received",
	// );
	// if (emailEvent) {
	// 	const email = emailEvent.data as EmailPayload;
	// 	if (email.from_address) {
	// 		return email.from_address;
	// 	}
	// }

	// return null;
};

const appendResult = async (
	thread: Thread,
	computeResult: () => Promise<Record<string, unknown>>,
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
		const result = await computeResult();
		thread.events.push({
			type: responseType,
			data: result,
		});
	} catch (_error) {
		const errorMessage = _error instanceof Error ? _error.message : String(_error);
		const errorEvent = await b.SquashResponseContext(
			threadToPrompt(thread),
			`error running ${thread.events.slice(-1)[0]?.type}: ${errorMessage}`,
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
	let aiStepOp: string | undefined;
	if (stateId) {
		aiStepOp = startOperation(stateId, "ai_step", "ai.determine_next_step", {
			source: "ai",
			payload: nextStep,
		});
	}
	let currentStateId: string | null = null;
	switch (nextStep.intent) {
		case "done_for_now": {
			currentStateId = await saveThreadState(
				thread,
				undefined,
				undefined,
				stateId,
			);

			const emailAddress = getEmailFromThread(thread);
            if (!emailAddress) {
				thread.events.push({
					type: "error",
					data: "No email address found in thread for human contact",
				});
				return false;
			}

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

			thread.events.push({
				type: "human_contact_sent",
				data: contactDelivery,
			});

			if (stateId && aiStepOp) {
				succeedOperation(stateId, "ai_step", aiStepOp, {
					result: { message: nextStep.message },
				});
			}
																
			return false;
		}

		case "request_more_information": {
			currentStateId = await saveThreadState(
				thread,
				undefined,
				undefined,
				stateId,
			);

			const emailAddress = getEmailFromThread(thread);
            if (!emailAddress) {
				thread.events.push({
					type: "error",
					data: "No email address found in thread for human contact",
				});
				return false;
			}

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

			thread.events.push({
				type: "human_contact_sent",
				data: contactDelivery,
			});

			if (stateId && aiStepOp) {
				succeedOperation(stateId, "ai_step", aiStepOp, {
					result: { message: nextStep.message },
				});
			}
			
			return false;
		}

		case "nothing_to_do":
			currentStateId = await saveThreadState(
				thread,
				undefined,
				undefined,
				stateId,
			);

			return false;

		case "await":

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
				let toolOperationId: string | undefined;
				if (stateId) {
					toolOperationId = startOperation(
						stateId,
						"tool_call",
						"tool.calculate",
						{
							source: "tool",
							parentOperationId: aiStepOp,
							payload: { expression: nextStep.expression },
						},
					);
				}
				const validation = validateMathematicalExpression(nextStep.expression);
				if (!validation.isValid) {
					if (stateId && toolOperationId) {
						failOperation(
							stateId,
							"tool_call",
							toolOperationId,
							validation.error || "invalid expression",
							{
								parentOperationId: aiStepOp,
								name: "tool.calculate",
								source: "tool",
							},
						);
					}
					return {
						expression: nextStep.expression,
						result: 0,
						error: validation.error,
						explanation: nextStep.explanation,
					};
				}

				const calculationResult = evaluateExpression(nextStep.expression);

				const result = {
					expression: nextStep.expression,
					result: calculationResult.result,
					steps: calculationResult.steps,
					error: calculationResult.error,
					explanation: nextStep.explanation,
				};

				const resultObj = {
					...result,
					formatted: formatCalculationResult(calculationResult),
				};
				if (stateId && toolOperationId) {
					succeedOperation(stateId, "tool_call", toolOperationId, {
						result: resultObj,
					});
				}
				if (stateId && aiStepOp) {
					succeedOperation(stateId, "ai_step", aiStepOp, { result: resultObj });
				}
				return resultObj;
			});

		default: {
			const errorMessage = `you called a tool that is not implemented: ${(nextStep as any).intent}, something is wrong with your internal programming, please get help from a human`;
			thread.events.push({
				type: "error",
				data: errorMessage,
			});
			if (stateId && aiStepOp) {
				failOperation(stateId, "ai_step", aiStepOp, errorMessage);
			}
			return thread;
		}
	}
};

export const handleNextStep = async (
	thread: Thread,
	stateId?: string,
): Promise<void> => {


	let nextThread: Thread | false = thread;

	while (true) {
		const nextStep = await b.DetermineNextStep(threadToPrompt(nextThread));



		nextThread = await _handleNextStep(thread, nextStep, stateId);
		if (!nextThread) {
			break;
		}
	}
};

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
