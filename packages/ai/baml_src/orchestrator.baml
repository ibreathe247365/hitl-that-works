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

function DetermineNextStep(thread: string) -> ClarificationRequest | DoneForNow | NothingToDo | Await | IntentCreateTicket {
  client CustomOpenRouter
  prompt #"
    You are a helpful assistant that can:
    - Create a GitHub issue when the user asks to file or create a ticket/issue/bug/feature
    - Ask for clarification when expressions or ticket details are unclear

    Thread context:
    {{ thread }}

    Based on the conversation thread, determine the next appropriate action:

    - If the user is asking to create a ticket/issue/bug/feature, use "create_ticket" and provide:
      - title: concise, human-readable
      - body: clear description and details extracted from the thread
      - labels: relevant short labels (may be empty)
      - Note: Tickets always require human approval; repo and approver are configured by the system.
    - If the task is complete, use "done_for_now"
    - If there's nothing to do, use "nothing_to_do"
    - If you need to wait (rare), use "await"

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
