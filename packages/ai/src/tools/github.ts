import { Octokit } from "@octokit/rest";

export async function createGitHubIssue(options: {
	title: string;
	body: string;
	labels?: string[];
}): Promise<{ url: string; number: number; createdAt: string }> {
	const token = process.env.GITHUB_TOKEN!;
	const repo = process.env.GITHUB_REPO!;

	const [owner, name] = repo.split("/");
	const octokit = new Octokit({ auth: token });
	const { data } = await octokit.issues.create({
		owner: owner!,
		repo: name!,
		title: options.title,
		body: options.body,
		labels: options.labels ?? [],
	});
	return {
		url: String(data.html_url),
		number: Number(data.number),
		createdAt: String(data.created_at),
	};
}

export async function searchGitHubIssues(options: {
	query: string;
	type: "issues" | "prs";
	filters?: string[];
}): Promise<{
	results: Array<{
		number: number;
		title: string;
		state: string;
		labels: string[];
		html_url: string;
		created_at: string;
		updated_at: string;
	}>;
	total_count: number;
}> {
	const token = process.env.GITHUB_TOKEN!;
	const repo = process.env.GITHUB_REPO!;

	const octokit = new Octokit({ auth: token });

	let searchQuery = options.query;
	if (options.filters && options.filters.length > 0) {
		searchQuery += " " + options.filters.join(" ");
	}

	searchQuery += ` repo:${repo}`;

	if (options.type === "prs") {
		searchQuery += " is:pr";
	} else {
		searchQuery += " is:issue";
	}

	const { data } = await octokit.search.issuesAndPullRequests({
		q: searchQuery,
		sort: "updated",
		order: "desc",
		per_page: 20,
	});

	return {
		results: data.items.map((item) => ({
			number: item.number,
			title: item.title,
			state: item.state,
			labels: item.labels
				?.map((label) => (typeof label === "string" ? label : label.name))
				.filter((label): label is string => Boolean(label)) || [],
			html_url: item.html_url,
			created_at: item.created_at,
			updated_at: item.updated_at,
		})),
		total_count: data.total_count,
	};
}

export async function updateGitHubIssue(options: {
	issue_number: number;
	title?: string;
	body?: string;
	labels?: string[];
	state?: "open" | "closed" | null;
}): Promise<{ url: string; number: number; updatedAt: string }> {
	const token = process.env.GITHUB_TOKEN!;
	const repo = process.env.GITHUB_REPO!;

	const [owner, name] = repo.split("/");
	const octokit = new Octokit({ auth: token });

	const updateData: {
		title?: string;
		body?: string;
		labels?: string[];
		state?: "open" | "closed";
	} = {};
	if (options.title !== undefined) updateData.title = options.title;
	if (options.body !== undefined) updateData.body = options.body;
	if (options.labels !== undefined) updateData.labels = options.labels;
	if (options.state !== undefined && options.state !== null) updateData.state = options.state;

	const { data } = await octokit.issues.update({
		owner: owner!,
		repo: name!,
		issue_number: options.issue_number,
		...updateData,
	});

	return {
		url: String(data.html_url),
		number: Number(data.number),
		updatedAt: String(data.updated_at),
	};
}

export async function commentOnGitHubIssue(options: {
	issue_number: number;
	comment: string;
}): Promise<{ comment_id: number; html_url: string }> {
	const token = process.env.GITHUB_TOKEN!;
	const repo = process.env.GITHUB_REPO!;

	const [owner, name] = repo.split("/");
	const octokit = new Octokit({ auth: token });

	const { data } = await octokit.issues.createComment({
		owner: owner!,
		repo: name!,
		issue_number: options.issue_number,
		body: options.comment,
	});

	return {
		comment_id: data.id,
		html_url: String(data.html_url),
	};
}

export async function linkGitHubIssues(options: {
	source_issue: number;
	target_issue: number;
	relationship: string;
}): Promise<{ success: boolean }> {
	const token = process.env.GITHUB_TOKEN!;
	const repo = process.env.GITHUB_REPO!;

	const [owner, name] = repo.split("/");
	const octokit = new Octokit({ auth: token });

	const linkText = `Linked to #${options.target_issue} (${options.relationship})`;

	await octokit.issues.createComment({
		owner: owner!,
		repo: name!,
		issue_number: options.source_issue,
		body: linkText,
	});

	const reverseRelationship =
		options.relationship === "blocks"
			? "blocked by"
			: options.relationship === "blocked_by"
				? "blocks"
				: options.relationship;
	const reverseLinkText = `Linked from #${options.source_issue} (${reverseRelationship})`;

	await octokit.issues.createComment({
		owner: owner!,
		repo: name!,
		issue_number: options.target_issue,
		body: reverseLinkText,
	});

	return { success: true };
}
