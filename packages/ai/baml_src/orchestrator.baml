class Calculation {
  operation string
  operands float[]
  result float
  expression string
}

class IntentCalculate {
  intent "calculate"
  expression string
  explanation string
}

class ClarificationRequest {
  intent "request_more_information"
  message string
}

class DoneForNow {
  intent "done_for_now"
  message string
}

class NothingToDo {
  intent "nothing_to_do"
  message string
}

class Await {
  intent "await"
  seconds int
  reasoning string
}

class IntentCreateTicket {
  intent "create_ticket"
  title string
  body string
  labels string[]
}

class IntentSearchGitHub {
  intent "search_github"
  query string @description(#"
    The search terms to use to search for issues or pull requests on GitHub.
  "#)
  type "issues" | "prs" @description(#"
    The type of items to search for - either "issues" or "prs" (pull requests).
  "#)
  filters string[] @description(#"
    Additional filters like "is:open", "label:bug", etc. May be empty.
  "#)
}

class IntentUpdateGitHubIssue {
  intent "update_github_issue"
  issue_number int @description(#"
    The number of the issue to update.
  "#)
  title string? @description(#"
    New title for the issue. Optional.
  "#)
  body string? @description(#"
    New description/body for the issue. Optional.
  "#)
  labels string[]? @description(#"
    New labels array for the issue. Optional.
  "#)
  state "open" | "closed"? @description(#"
    New state for the issue - either "open" or "closed". Optional.
  "#)
}

class IntentCommentOnIssue {
  intent "comment_on_issue"
  issue_number int @description(#"
    The number of the issue to add a comment to.
  "#)
  comment string @description(#"
    The comment text to add to the issue.
  "#)
}

class IntentLinkIssues {
  intent "link_issues"
  source_issue int @description(#"
    The issue number that is the source of the relationship.
  "#)
  target_issue int @description(#"
    The issue number that is the target of the relationship.
  "#)
  relationship "blocks" | "blocked_by" | "relates_to" | "duplicates" @description(#"
    The type of relationship between the issues.
  "#)
}

function DetermineNextStep(thread: string) -> ClarificationRequest | DoneForNow | NothingToDo | Await | IntentCreateTicket | IntentSearchGitHub | IntentUpdateGitHubIssue | IntentCommentOnIssue | IntentLinkIssues {
  client CustomOpenRouter
  prompt #"
    You are a helpful assistant that can:
    - Create GitHub issues when users ask to file tickets/issues/bugs/features
    - Search GitHub issues and pull requests to find existing items
    - Update GitHub issues (title, body, labels, state)
    - Comment on GitHub issues
    - Link GitHub issues with relationships
    - Ask for clarification when details are unclear

    Thread context:
    {{ thread }}

    Based on the conversation thread, determine the next appropriate action:

    - If the user wants to create a ticket/issue/bug/feature, use "create_ticket"
    - If the user wants to search for existing issues/PRs, use "search_github"
    - If the user wants to update an existing issue, use "update_github_issue"
    - If the user wants to add a comment to an issue, use "comment_on_issue"
    - If the user wants to link two issues, use "link_issues"
    - If the task is complete, use "done_for_now"
    - If there's nothing to do, use "nothing_to_do"
    - If you need to wait (rare), use "await"

    Note: All GitHub operations work on the configured repository. Tickets and mutations require human approval.

    {{ ctx.output_format }}
  "#
}

function SquashResponseContext(thread: string, error: string) -> string {
  client CustomOpenRouter
  prompt #"
    You are summarizing an error that occurred during calculation processing.
    
    Thread context:
    {{ thread }}
    
    Error:
    {{ error }}
    
    Provide a concise, user-friendly error message that explains what went wrong and suggests how to fix it.
    
    {{ ctx.output_format }}
  "#
}
