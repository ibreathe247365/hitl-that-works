import {
    type Await,
    b,
    type ClarificationRequest,
    type DoneForNow,
    type NothingToDo,
    type IntentCreateTicket,
} from "./baml_client";
import { createHumanContact } from "./contact";
import { createGitHubIssue } from "./tools/github";
import { sendEmailFunctionApprovalRequest } from "./contact";
import { sendSlackFunctionApprovalRequest } from "./contact";
import type {
	Event,
	FunctionCallCompleted,
	HumanContactCompleted,
	Thread,
	WebhookPayload,
} from "./schemas";
import { saveThreadState } from "./state";
import { failOperation, startOperation, succeedOperation } from "./sync";
import { threadToPrompt } from "./utils";



type CreateGitHubIssueKwargs = {
    repo?: string;
    title: string;
    body: string;
    labels?: string[];
};

type FunctionKwargs = CreateGitHubIssueKwargs;

const functionHandlers: Record<
	string,
	(thread: Thread, kwargs: FunctionKwargs) => Promise<Thread>
> = {
    create_github_issue: async (thread, kwargs) => {
        const { repo, title, body, labels } = kwargs as CreateGitHubIssueKwargs;
        const issue = await createGitHubIssue({
            repo: repo || "",
            title,
            body,
            labels: labels ?? [],
        });
        thread.events.push({
            type: "function_result",
            data: { fn: "create_github_issue", issue },
        });
        return thread;
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
		const errorMessage =
			_error instanceof Error ? _error.message : String(_error);
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
        | NothingToDo
        | Await
        | IntentCreateTicket,
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
        case "create_ticket": {
            const ticket = nextStep as IntentCreateTicket;
            const title = ticket.title?.trim() || "New issue";
            const body = ticket.body?.trim() || "No description provided.";
            const labels = ticket.labels || [];
            const repo = process.env.GITHUB_REPO || "";
            const approverEmail = "delivered@resend.dev";

            currentStateId = await saveThreadState(
                thread,
                undefined,
                undefined,
                stateId,
            );

            thread.events.push({
                type: "function_call",
                data: { fn: "create_github_issue", kwargs: { repo, title, body, labels } },
            });

            await sendSlackFunctionApprovalRequest(
                `Approve creating a GitHub issue?\n\nTitle: ${title}\n\nLabels: ${labels.join(", ") || "(none)"}`,
                { slack: { channel_id: "webhook" } },
                currentStateId || "",
                "create_github_issue",
                { repo, title, body, labels },
            );

            if (approverEmail) {
                await sendEmailFunctionApprovalRequest(
                    "Approve creating a GitHub issue?",
                    { email: { address: approverEmail, subject: "Approval needed: GitHub issue" } },
                    currentStateId || "",
                    "create_github_issue",
                    { repo, title, body, labels },
                );
            }

            thread.events.push({
                type: "human_contact_sent",
                data: { message: "Approval links sent", timestamp: Date.now() },
            });

            if (stateId && aiStepOp) {
                succeedOperation(stateId, "ai_step", aiStepOp, {
                    result: { message: "Awaiting approval for GitHub issue creation" },
                });
            }
            return false;
        }
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
				[
					{
						email: {
							address: emailAddress,
							subject: "AI Agent Task Completed",
						},
					},
					{
						slack: {
							channel_id: "webhook",
						},
					},
				],
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
				[
					{
						email: {
							address: emailAddress,
							subject: "AI Agent Needs Clarification",
						},
					},
					{
						slack: {
							channel_id: "webhook",
						},
					},
				],
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
