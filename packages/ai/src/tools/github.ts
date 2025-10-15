import { Octokit } from "@octokit/rest";

export async function createGitHubIssue(options: {
  repo?: string;
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


