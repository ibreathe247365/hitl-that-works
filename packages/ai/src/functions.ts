import type { Thread } from "./schemas";
import {
	commentOnGitHubIssue,
	createGitHubIssue,
	linkGitHubIssues,
	searchGitHubIssues,
	updateGitHubIssue,
} from "./tools/github";

export type CreateGitHubIssueKwargs = {
	title: string;
	body: string;
	labels?: string[];
};

export type SearchGitHubKwargs = {
	query: string;
	type: "issues" | "prs";
	filters?: string[];
};

export type UpdateGitHubIssueKwargs = {
	issue_number: number;
	title?: string;
	body?: string;
	labels?: string[];
	state?: "open" | "closed" | null;
};

export type CommentOnIssueKwargs = {
	issue_number: number;
	comment: string;
};

export type LinkIssuesKwargs = {
	source_issue: number;
	target_issue: number;
	relationship: string;
};

export type FunctionKwargs =
	| CreateGitHubIssueKwargs
	| SearchGitHubKwargs
	| UpdateGitHubIssueKwargs
	| CommentOnIssueKwargs
	| LinkIssuesKwargs;

export type FunctionHandler = (
	thread: Thread,
	kwargs: FunctionKwargs,
) => Promise<Thread>;

export const functionHandlers: Record<string, FunctionHandler> = {
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
