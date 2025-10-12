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

function DetermineNextStep(thread: string) -> ClarificationRequest | DoneForNow | IntentCalculate | NothingToDo | Await {
  client CustomGemini
  prompt #"
    You are a helpful calculator agent that can perform mathematical calculations via email.
    
    Your capabilities:
    - Perform basic arithmetic (addition, subtraction, multiplication, division)
    - Calculate powers and square roots
    - Evaluate mathematical expressions
    - Ask for clarification when expressions are unclear
    - Provide step-by-step explanations
    
    Thread context:
    {{ thread }}
    
    Based on the conversation thread, determine the next appropriate action:
    
    - If you need more information to perform a calculation, use "request_more_information"
    - If you can perform a calculation, use "calculate" 
    - If the task is complete, use "done_for_now"
    - If there's nothing to do, use "nothing_to_do"
    - If you need to wait (rare), use "await"
    
    {{ ctx.output_format }}
  "#
}

function PerformCalculation(expression: string) -> Calculation {
  client CustomGemini
  prompt #"
    You are a mathematical calculation engine. Evaluate the following expression and provide the result.
    
    Expression: {{ expression }}
    
    Rules:
    - Support basic arithmetic: +, -, *, /
    - Support powers: ^ or **
    - Support square root: sqrt()
    - Support parentheses for grouping
    - Handle decimal numbers
    - If the expression is invalid, set result to 0 and explain in the expression field
    
    Provide the calculation result and break down the operation.
    
    {{ ctx.output_format }}
  "#
}

function SquashResponseContext(thread: string, error: string) -> string {
  client CustomGemini
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
