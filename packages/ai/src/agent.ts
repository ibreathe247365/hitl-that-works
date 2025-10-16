import {
	type Await,
	b,
	type ClarificationRequest,
	type DoneForNow,
	type IntentCommentOnIssue,
	type IntentCreateTicket,
	type IntentLinkIssues,
	type IntentSearchGitHub,
	type IntentUpdateGitHubIssue,
	type NothingToDo,
} from "./baml_client";
import {
	createHumanContact,
	sendEmailFunctionApprovalRequest,
	sendSlackFunctionApprovalRequest,
} from "./contact";
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
	commentOnGitHubIssue,
	createGitHubIssue,
	linkGitHubIssues,
	searchGitHubIssues,
	updateGitHubIssue,
} from "./tools/github";
import { threadToPrompt } from "./utils";

type CreateGitHubIssueKwargs = {
	title: string;
	body: string;
	labels?: string[];
};

type SearchGitHubKwargs = {
	query: string;
	type: "issues" | "prs";
	filters?: string[];
};

type UpdateGitHubIssueKwargs = {
	issue_number: number;
	title?: string;
	body?: string;
	labels?: string[];
	state?: "open" | "closed" | null;
};

type CommentOnIssueKwargs = {
	issue_number: number;
	comment: string;
};

type LinkIssuesKwargs = {
	source_issue: number;
	target_issue: number;
	relationship: string;
};

type FunctionKwargs =
	| CreateGitHubIssueKwargs
	| SearchGitHubKwargs
	| UpdateGitHubIssueKwargs
	| CommentOnIssueKwargs
	| LinkIssuesKwargs;

const functionHandlers: Record<
	string,
	(thread: Thread, kwargs: FunctionKwargs) => Promise<Thread>
> = {
	create_github_issue: async (thread, kwargs) => {
		const { title, body, labels } = kwargs as CreateGitHubIssueKwargs;
		const issue = await createGitHubIssue({
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
	search_github: async (thread, kwargs) => {
		const { query, type, filters } = kwargs as SearchGitHubKwargs;
		const results = await searchGitHubIssues({
			query,
			type,
			filters: filters ?? [],
		});
		thread.events.push({
			type: "github_search_result",
			data: {
				query,
				type,
				results: results.results,
				total_count: results.total_count,
			},
		});
		return thread;
	},
	update_github_issue: async (thread, kwargs) => {
		const { issue_number, title, body, labels, state } =
			kwargs as UpdateGitHubIssueKwargs;
		const result = await updateGitHubIssue({
			issue_number,
			title,
			body,
			labels,
			state,
		});
		thread.events.push({
			type: "function_result",
			data: { fn: "update_github_issue", issue: result },
		});
		return thread;
	},
	comment_on_issue: async (thread, kwargs) => {
		const { issue_number, comment } = kwargs as CommentOnIssueKwargs;
		const result = await commentOnGitHubIssue({
			issue_number,
			comment,
		});
		thread.events.push({
			type: "function_result",
			data: { fn: "comment_on_issue", ...result },
		});
		return thread;
	},
	link_issues: async (thread, kwargs) => {
		const { source_issue, target_issue, relationship } =
			kwargs as LinkIssuesKwargs;
		const result = await linkGitHubIssues({
			source_issue,
			target_issue,
			relationship,
		});
		thread.events.push({
			type: "function_result",
			data: {
				fn: "link_issues",
				source_issue,
				target_issue,
				relationship,
				...result,
			},
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
		| IntentCreateTicket
		| IntentSearchGitHub
		| IntentUpdateGitHubIssue
		| IntentCommentOnIssue
		| IntentLinkIssues,
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
		case "search_github": {
			const searchIntent = nextStep as IntentSearchGitHub;
			const query = searchIntent.query?.trim() || "";
			const type = searchIntent.type || "issues";
			const filters = searchIntent.filters || [];

			thread.events.push({
				type: "function_call",
				data: { fn: "search_github", kwargs: { query, type, filters } },
			});

			const handler = functionHandlers["search_github"];
			if (handler) {
				const updatedThread = await handler(thread, { query, type, filters });
				if (stateId && aiStepOp) {
					succeedOperation(stateId, "ai_step", aiStepOp, {
						result: { message: "GitHub search completed" },
					});
				}
				return updatedThread;
			}

			thread.events.push({
				type: "error",
				data: "Failed to execute GitHub search",
			});
			return false;
		}
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
				data: {
					fn: "create_github_issue",
					kwargs: { repo, title, body, labels },
				},
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
					{
						email: {
							address: approverEmail,
							subject: "Approval needed: GitHub issue",
						},
					},
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
		case "update_github_issue": {
			const updateIntent = nextStep as IntentUpdateGitHubIssue;
			const issue_number = updateIntent.issue_number;
			const title = updateIntent.title?.trim();
			const body = updateIntent.body?.trim();
			const labels = updateIntent.labels || [];
			const state = updateIntent.state;
			const approverEmail = "delivered@resend.dev";

			currentStateId = await saveThreadState(
				thread,
				undefined,
				undefined,
				stateId,
			);

			thread.events.push({
				type: "function_call",
				data: {
					fn: "update_github_issue",
					kwargs: { issue_number, title, body, labels, state },
				},
			});

			await sendSlackFunctionApprovalRequest(
				`Approve updating GitHub issue #${issue_number}?\n\nTitle: ${title || "(no change)"}\n\nLabels: ${labels.join(", ") || "(no change)"}\n\nState: ${state || "(no change)"}`,
				{ slack: { channel_id: "webhook" } },
				currentStateId || "",
				"update_github_issue",
				{ issue_number, title, body, labels, state },
			);

			if (approverEmail) {
				await sendEmailFunctionApprovalRequest(
					"Approve updating GitHub issue?",
					{
						email: {
							address: approverEmail,
							subject: "Approval needed: GitHub issue update",
						},
					},
					currentStateId || "",
					"update_github_issue",
					{ issue_number, title, body, labels, state },
				);
			}

			thread.events.push({
				type: "human_contact_sent",
				data: { message: "Approval links sent", timestamp: Date.now() },
			});

			if (stateId && aiStepOp) {
				succeedOperation(stateId, "ai_step", aiStepOp, {
					result: { message: "Awaiting approval for GitHub issue update" },
				});
			}
			return false;
		}
		case "comment_on_issue": {
			const commentIntent = nextStep as IntentCommentOnIssue;
			const issue_number = commentIntent.issue_number;
			const comment = commentIntent.comment?.trim() || "";
			const approverEmail = "delivered@resend.dev";

			currentStateId = await saveThreadState(
				thread,
				undefined,
				undefined,
				stateId,
			);

			thread.events.push({
				type: "function_call",
				data: { fn: "comment_on_issue", kwargs: { issue_number, comment } },
			});

			await sendSlackFunctionApprovalRequest(
				`Approve commenting on GitHub issue #${issue_number}?\n\nComment: ${comment}`,
				{ slack: { channel_id: "webhook" } },
				currentStateId || "",
				"comment_on_issue",
				{ issue_number, comment },
			);

			if (approverEmail) {
				await sendEmailFunctionApprovalRequest(
					"Approve commenting on GitHub issue?",
					{
						email: {
							address: approverEmail,
							subject: "Approval needed: GitHub issue comment",
						},
					},
					currentStateId || "",
					"comment_on_issue",
					{ issue_number, comment },
				);
			}

			thread.events.push({
				type: "human_contact_sent",
				data: { message: "Approval links sent", timestamp: Date.now() },
			});

			if (stateId && aiStepOp) {
				succeedOperation(stateId, "ai_step", aiStepOp, {
					result: { message: "Awaiting approval for GitHub issue comment" },
				});
			}
			return false;
		}
		case "link_issues": {
			const linkIntent = nextStep as IntentLinkIssues;
			const source_issue = linkIntent.source_issue;
			const target_issue = linkIntent.target_issue;
			const relationship = linkIntent.relationship;
			const approverEmail = "delivered@resend.dev";

			currentStateId = await saveThreadState(
				thread,
				undefined,
				undefined,
				stateId,
			);

			thread.events.push({
				type: "function_call",
				data: {
					fn: "link_issues",
					kwargs: { source_issue, target_issue, relationship },
				},
			});

			await sendSlackFunctionApprovalRequest(
				`Approve linking GitHub issues #${source_issue} and #${target_issue}?\n\nRelationship: ${relationship}`,
				{ slack: { channel_id: "webhook" } },
				currentStateId || "",
				"link_issues",
				{ source_issue, target_issue, relationship },
			);

			if (approverEmail) {
				await sendEmailFunctionApprovalRequest(
					"Approve linking GitHub issues?",
					{
						email: {
							address: approverEmail,
							subject: "Approval needed: GitHub issue linking",
						},
					},
					currentStateId || "",
					"link_issues",
					{ source_issue, target_issue, relationship },
				);
			}

			thread.events.push({
				type: "human_contact_sent",
				data: { message: "Approval links sent", timestamp: Date.now() },
			});

			if (stateId && aiStepOp) {
				succeedOperation(stateId, "ai_step", aiStepOp, {
					result: { message: "Awaiting approval for GitHub issue linking" },
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
