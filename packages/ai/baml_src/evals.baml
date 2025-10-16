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

test ContextualCommentAfterSearch {
  functions [DetermineNextStep]
  args {
    thread #"
      User: "add a comment to the first issue saying I'm working on it"
      
      Thread: [
        {
          type: "search_github",
          data: {
            intent: "search_github",
            query: "bug reports",
            type: "issues",
            filters: []
          }
        },
        {
          type: "github_search_result",
          data: {
            query: "bug reports",
            type: "issues",
            results: [
              {
                number: 15,
                title: "Critical bug in login system",
                state: "open",
                labels: ["bug", "critical"],
                html_url: "https://github.com/owner/repo/issues/15",
                created_at: "2025-10-15T20:08:59Z",
                updated_at: "2025-10-15T20:08:59Z"
              },
              {
                number: 20,
                title: "Fix memory leak",
                state: "open",
                labels: ["bug"],
                html_url: "https://github.com/owner/repo/issues/20",
                created_at: "2025-10-14T15:30:00Z",
                updated_at: "2025-10-14T15:30:00Z"
              }
            ],
            total_count: 2
          }
        }
      ]
    "#
  }
  @@assert({{ this.intent == "comment_on_issue" }})
  @@assert({{ this.issue_number == 15 }})
  @@assert({{ "working on it" in this.comment }})
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

test ReferToIssueByPosition {
  functions [DetermineNextStep]
  args {
    thread #"
      User: "close the second one"
      
      Thread: [
        {
          type: "search_github",
          data: {
            intent: "search_github",
            query: "open issues",
            type: "issues",
            filters: ["is:open"]
          }
        },
        {
          type: "github_search_result",
          data: {
            query: "open issues",
            type: "issues",
            results: [
              {
                number: 5,
                title: "First issue",
                state: "open",
                labels: ["bug"],
                html_url: "https://github.com/owner/repo/issues/5",
                created_at: "2025-10-15T20:08:59Z",
                updated_at: "2025-10-15T20:08:59Z"
              },
              {
                number: 8,
                title: "Second issue",
                state: "open",
                labels: ["enhancement"],
                html_url: "https://github.com/owner/repo/issues/8",
                created_at: "2025-10-14T15:30:00Z",
                updated_at: "2025-10-14T15:30:00Z"
              },
              {
                number: 12,
                title: "Third issue",
                state: "open",
                labels: ["feature"],
                html_url: "https://github.com/owner/repo/issues/12",
                created_at: "2025-10-13T10:15:00Z",
                updated_at: "2025-10-13T10:15:00Z"
              }
            ],
            total_count: 3
          }
        }
      ]
    "#
  }
  @@assert({{ this.intent == "update_github_issue" }})
  @@assert({{ this.issue_number == 8 }})
  @@assert({{ this.state == "closed" }})
}

test EmptyQueryAllIssues {
  functions [DetermineNextStep]
  args {
    thread #"
      User: "search for all the issues"
      
      Thread: []
    "#
  }
  @@assert({{ this.intent == "search_github" }})
  @@assert({{ this.query == "" }})
  @@assert({{ this.type == "issues" }})
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

test UpdateAfterFunctionResult {
  functions [DetermineNextStep]
  args {
    thread #"
      User: "actually, also add the urgent label"
      
      Thread: [
        {
          type: "update_github_issue",
          data: {
            intent: "update_github_issue",
            issue_number: 101,
            title: "Fix API rate limiting",
            body: "Updated description",
            labels: ["api"],
          }
        },
        {
          type: "function_call",
          data: {
            fn: "update_github_issue",
            kwargs: {
              issue_number: 101,
              title: "Fix API rate limiting",
              body: "Updated description",
              labels: ["api"],
            }
          }
        },
        {
          type: "function_result",
          data: {
            fn: "update_github_issue",
            issue: {
              url: "https://github.com/owner/repo/issues/101",
              number: 101,
              updatedAt: "2025-10-16T04:36:56Z"
            }
          }
        },
        {
          type: "done_for_now",
          data: {
            intent: "done_for_now",
            message: "Updated issue #101"
          }
        }
      ]
    "#
  }
  @@assert({{ this.intent == "update_github_issue" }})
  @@assert({{ this.issue_number == 101 }})
  @@assert({{ "urgent" in this.labels }})
}

test AssigneeSearchMyIssues {
  functions [DetermineNextStep]
  args {
    thread #"
      User: "what issues do i have on gh"
      
      Thread: []
    "#
  }
  @@assert({{ this.intent == "search_github" }})
  @@assert({{ this.query == "assignee:@me" }})
  @@assert({{ this.type == "issues" }})
}

test MultiTurnSearchCreateUpdate {
  functions [DetermineNextStep]
  args {
    thread #"
      User: "update the issue with more details"
      
      Thread: [
        {
          type: "human_response",
          data: "what issues do i have on gh"
        },
        {
          type: "search_github",
          data: {
            intent: "search_github",
            query: "assignee:@me",
            type: "issues",
            filters: []
          }
        },
        {
          type: "function_call",
          data: {
            fn: "search_github",
            kwargs: {
              query: "assignee:@me",
              type: "issues",
              filters: []
            }
          }
        },
        {
          type: "github_search_result",
          data: {
            query: "assignee:@me",
            type: "issues",
            results: [],
            total_count: 0
          }
        },
        {
          type: "done_for_now",
          data: {
            intent: "done_for_now",
            message: "I checked for issues assigned to you, and there are currently none."
          }
        },
        {
          type: "human_response",
          data: "add another feature request to support markdown in baml using backticks"
        },
        {
          type: "create_ticket",
          data: {
            intent: "create_ticket",
            title: "Feature request: Support markdown in BAML using backticks",
            body: "Add support for rendering markdown syntax within BAML templates when enclosed in backticks.",
            labels: ["enhancement", "markdown", "baml"]
          }
        },
        {
          type: "function_call",
          data: {
            fn: "create_github_issue",
            kwargs: {
              repo: "owner/repo",
              title: "Feature request: Support markdown in BAML using backticks",
              body: "Add support for rendering markdown syntax within BAML templates when enclosed in backticks.",
              labels: ["enhancement", "markdown", "baml"]
            }
          }
        },
        {
          type: "function_result",
          data: {
            fn: "create_github_issue",
            issue: {
              url: "https://github.com/owner/repo/issues/2",
              number: 2,
              createdAt: "2025-10-16T04:29:00Z"
            }
          }
        },
        {
          type: "done_for_now",
          data: {
            intent: "done_for_now",
            message: "Created a new feature request: #2"
          }
        }
      ]
    "#
  }
  @@assert({{ this.intent == "update_github_issue" }})
  @@assert({{ this.issue_number == 2 }})
  @@assert({{ this.body != "" }})
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

test ContextualUpdateAfterCreate {
  functions [DetermineNextStep]
  args {
    thread #"
      User: "update the issue you created with better description"
      
      Thread: [
        {
          type: "create_ticket",
          data: {
            intent: "create_ticket",
            title: "Add dark mode support",
            body: "Users want dark mode",
            labels: ["enhancement"]
          }
        },
        {
          type: "function_result",
          data: {
            fn: "create_github_issue",
            issue: {
              url: "https://github.com/owner/repo/issues/42",
              number: 42,
              createdAt: "2025-10-16T04:29:00Z"
            }
          }
        },
        {
          type: "done_for_now",
          data: {
            intent: "done_for_now",
            message: "Created issue #42"
          }
        }
      ]
    "#
  }
  @@assert({{ this.intent == "update_github_issue" }})
  @@assert({{ this.issue_number == 42 }})
  @@assert({{ this.body != "" }})
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