test CreateBugReport {
  functions [DetermineNextStep]
  args {
    thread #"
      User: "I found a bug in the login system. When users try to log in with special characters in their password, the system crashes with a 500 error. This happens specifically with passwords containing @ symbols."
      
      Thread: []
    "#
  }
  @@assert({{ this.intent == "create_ticket" }})
  @@assert({{ this.title == "Login system crashes with special characters in password" }})
  @@assert({{ "Bug Description" in this.body }})
  @@assert({{ "bug" in this.labels }})
}

test SearchExistingBugs {
  functions [DetermineNextStep]
  args {
    thread #"
      User: "Are there any existing issues with the payment processing system? I want to check if someone already reported problems with credit card validation."
      
      Thread: []
    "#
  }
  @@assert({{ this.intent == "search_github" }})
  @@assert({{ this.query == "payment processing credit card validation" }})
  @@assert({{ this.type == "issues" }})
}

test UpdateIssueTitle {
  functions [DetermineNextStep]
  args {
    thread #"
      User: "Can you update issue #123 to have a better title? The current title 'Fix bug' is too vague. Change it to 'Fix memory leak in user session handling'."
      
      Thread: [
        {
          type: "search_github",
          data: {
            intent: "search_github",
            query: "memory leak",
            type: "issues",
            filters: []
          }
        }
      ]
    "#
  }
  @@assert({{ this.intent == "update_github_issue" }})
  @@assert({{ this.issue_number == 123 }})
  @@assert({{ this.title == "Fix memory leak in user session handling" }})
}

test AddCommentToIssue {
  functions [DetermineNextStep]
  args {
    thread #"
      User: "Add a comment to issue #101 saying 'I've identified the root cause. The issue is in the caching layer. I'll submit a fix by tomorrow.'"
      
      Thread: [
        {
          type: "search_github",
          data: {
            intent: "search_github",
            query: "caching issue",
            type: "issues",
            filters: []
          }
        }
      ]
    "#
  }
  @@assert({{ this.intent == "comment_on_issue" }})
  @@assert({{ this.issue_number == 101 }})
  @@assert({{ "root cause" in this.comment }})
}

test LinkIssuesBlocks {
  functions [DetermineNextStep]
  args {
    thread #"
      User: "Link issue #202 to issue #203. Issue #202 blocks issue #203 from being completed."
      
      Thread: [
        {
          type: "search_github",
          data: {
            intent: "search_github",
            query: "blocking issues",
            type: "issues",
            filters: []
          }
        }
      ]
    "#
  }
  @@assert({{ this.intent == "link_issues" }})
  @@assert({{ this.source_issue == 202 }})
  @@assert({{ this.target_issue == 203 }})
  @@assert({{ this.relationship == "blocks" }})
}

test ClarificationRequest {
  functions [DetermineNextStep]
  args {
    thread #"
      User: "I want to create a ticket for the login issue."
      
      Thread: []
    "#
  }
  @@assert({{ this.intent == "request_more_information" }})
  @@assert({{ "more details" in this.message }})
}

test DoneForNow {
  functions [DetermineNextStep]
  args {
    thread #"
      User: "Thanks, that's all I needed for now."
      
      Thread: [
        {
          type: "search_github",
          data: {
            intent: "search_github",
            query: "completed tasks",
            type: "issues",
            filters: []
          }
        }
      ]
    "#
  }
  @@assert({{ this.intent == "done_for_now" }})
  @@assert({{ "completed" in this.message }})
}

test CreateFeatureRequest {
  functions [DetermineNextStep]
  args {
    thread #"
      User: "Can we add dark mode support to the dashboard? Users have been asking for this feature and it would improve the user experience, especially for those who work late hours."
      
      Thread: []
    "#
  }
  @@assert({{ this.intent == "create_ticket" }})
  @@assert({{ this.title == "Add dark mode support to dashboard" }})
  @@assert({{ "Feature Request" in this.body }})
  @@assert({{ "enhancement" in this.labels }})
}

test SearchPullRequests {
  functions [DetermineNextStep]
  args {
    thread #"
      User: "Show me all the recent pull requests related to database optimization. I want to see what changes have been made."
      
      Thread: []
    "#
  }
  @@assert({{ this.intent == "search_github" }})
  @@assert({{ this.query == "database optimization" }})
  @@assert({{ this.type == "prs" }})
}

test SearchWithFilters {
  functions [DetermineNextStep]
  args {
    thread #"
      User: "Find all open issues with the 'security' label that are related to authentication."
      
      Thread: []
    "#
  }
  @@assert({{ this.intent == "search_github" }})
  @@assert({{ this.query == "authentication" }})
  @@assert({{ this.type == "issues" }})
  @@assert({{ "is:open" in this.filters }})
  @@assert({{ "label:security" in this.filters }})
}

test UpdateIssueLabels {
  functions [DetermineNextStep]
  args {
    thread #"
      User: "Add the 'urgent' and 'backend' labels to issue #456. This is a critical database issue that needs immediate attention."
      
      Thread: [
        {
          type: "search_github",
          data: {
            intent: "search_github",
            query: "database issue",
            type: "issues",
            filters: []
          }
        }
      ]
    "#
  }
  @@assert({{ this.intent == "update_github_issue" }})
  @@assert({{ this.issue_number == 456 }})
  @@assert({{ "urgent" in this.labels }})
  @@assert({{ "backend" in this.labels }})
}

test CloseIssue {
  functions [DetermineNextStep]
  args {
    thread #"
      User: "Close issue #789. The problem has been resolved in the latest release."
      
      Thread: [
        {
          type: "search_github",
          data: {
            intent: "search_github",
            query: "resolved issue",
            type: "issues",
            filters: []
          }
        }
      ]
    "#
  }
  @@assert({{ this.intent == "update_github_issue" }})
  @@assert({{ this.issue_number == 789 }})
  @@assert({{ this.state == "closed" }})
}

test LinkIssuesDuplicates {
  functions [DetermineNextStep]
  args {
    thread #"
      User: "Mark issue #304 as a duplicate of issue #305. They're describing the same problem."
      
      Thread: [
        {
          type: "search_github",
          data: {
            intent: "search_github",
            query: "duplicate issues",
            type: "issues",
            filters: []
          }
        }
      ]
    "#
  }
  @@assert({{ this.intent == "link_issues" }})
  @@assert({{ this.source_issue == 304 }})
  @@assert({{ this.target_issue == 305 }})
  @@assert({{ this.relationship == "duplicates" }})
}

test LinkIssuesRelates {
  functions [DetermineNextStep]
  args {
    thread #"
      User: "Link issue #406 to issue #407. They're related but not duplicates - they're different aspects of the same feature."
      
      Thread: [
        {
          type: "search_github",
          data: {
            intent: "search_github",
            query: "related features",
            type: "issues",
            filters: []
          }
        }
      ]
    "#
  }
  @@assert({{ this.intent == "link_issues" }})
  @@assert({{ this.source_issue == 406 }})
  @@assert({{ this.target_issue == 407 }})
  @@assert({{ this.relationship == "relates_to" }})
}

test SearchComplexQuery {
  functions [DetermineNextStep]
  args {
    thread #"
      User: "Find all closed pull requests from the last month that were related to performance improvements and had the 'performance' label."
      
      Thread: []
    "#
  }
  @@assert({{ this.intent == "search_github" }})
  @@assert({{ this.query == "performance improvements" }})
  @@assert({{ this.type == "prs" }})
  @@assert({{ "is:closed" in this.filters }})
  @@assert({{ "label:performance" in this.filters }})
}

test UpdateMultipleFields {
  functions [DetermineNextStep]
  args {
    thread #"
      User: "Update issue #999 with a new title 'Fix API rate limiting for external integrations', add the 'api' and 'integration' labels, and update the description to include the specific error codes we're seeing."
      
      Thread: [
        {
          type: "search_github",
          data: {
            intent: "search_github",
            query: "API rate limiting",
            type: "issues",
            filters: []
          }
        }
      ]
    "#
  }
  @@assert({{ this.intent == "update_github_issue" }})
  @@assert({{ this.issue_number == 999 }})
  @@assert({{ this.title == "Fix API rate limiting for external integrations" }})
  @@assert({{ "api" in this.labels }})
  @@assert({{ "integration" in this.labels }})
}

test SearchRecentIssues {
  functions [DetermineNextStep]
  args {
    thread #"
      User: "Show me all the issues created in the last week that are still open."
      
      Thread: []
    "#
  }
  @@assert({{ this.intent == "search_github" }})
  @@assert({{ this.type == "issues" }})
  @@assert({{ "is:open" in this.filters }})
}

test LinkIssuesBlockedBy {
  functions [DetermineNextStep]
  args {
    thread #"
      User: "Issue #1111 is blocked by issue #1112. The deployment can't proceed until the database migration is complete."
      
      Thread: [
        {
          type: "search_github",
          data: {
            intent: "search_github",
            query: "deployment database migration",
            type: "issues",
            filters: []
          }
        }
      ]
    "#
  }
  @@assert({{ this.intent == "link_issues" }})
  @@assert({{ this.source_issue == 1111 }})
  @@assert({{ this.target_issue == 1112 }})
  @@assert({{ this.relationship == "blocked_by" }})
}

test InvalidIssueNumber {
  functions [DetermineNextStep]
  args {
    thread #"
      User: "Update issue #abc with a new title 'Fix invalid issue number handling'."
      
      Thread: []
    "#
  }
  @@assert({{ this.intent == "request_more_information" }})
  @@assert({{ "valid issue number" in this.message }})
}

test AmbiguousSearch {
  functions [DetermineNextStep]
  args {
    thread #"
      User: "Find the bug."
      
      Thread: []
    "#
  }
  @@assert({{ this.intent == "request_more_information" }})
  @@assert({{ "more specific details" in this.message }})
}

test MultipleOperations {
  functions [DetermineNextStep]
  args {
    thread #"
      User: "I need to: 1) Search for all open issues with 'bug' label, 2) Update issue #123 with 'urgent' label, 3) Add a comment to issue #456, and 4) Link issue #789 to issue #101 as duplicates."
      
      Thread: []
    "#
  }
  @@assert({{ this.intent == "search_github" }})
  @@assert({{ this.type == "issues" }})
  @@assert({{ "is:open" in this.filters }})
  @@assert({{ "label:bug" in this.filters }})
}

test EmptySearch {
  functions [DetermineNextStep]
  args {
    thread #"
      User: "Search for issues."
      
      Thread: []
    "#
  }
  @@assert({{ this.intent == "search_github" }})
  @@assert({{ this.type == "issues" }})
}

test VeryLongComment {
  functions [DetermineNextStep]
  args {
    thread #"
      User: "Add this comment to issue #555: 'This is a very detailed analysis of the problem. The issue occurs when users attempt to upload files larger than 10MB through the web interface. The error manifests as a timeout after 30 seconds, but the actual problem is in the file validation logic. The validation function is checking the file size before the upload completes, which causes a race condition. Additionally, the error handling is not properly catching the specific exception thrown by the file system when the disk space is insufficient. This needs to be fixed by: 1) Moving the file size check to after the upload completes, 2) Adding proper disk space validation, 3) Implementing proper error handling for file system exceptions, and 4) Adding progress indicators for large file uploads.'"
      
      Thread: [
        {
          type: "search_github",
          data: {
            intent: "search_github",
            query: "file upload timeout",
            type: "issues",
            filters: []
          }
        }
      ]
    "#
  }
  @@assert({{ this.intent == "comment_on_issue" }})
  @@assert({{ this.issue_number == 555 }})
  @@assert({{ "detailed analysis" in this.comment }})
}

test NothingToDo {
  functions [DetermineNextStep]
  args {
    thread #"
      User: "Hello, how are you?"
      
      Thread: []
    "#
  }
  @@assert({{ this.intent == "nothing_to_do" }})
  @@assert({{ "Hello" in this.message }})
}