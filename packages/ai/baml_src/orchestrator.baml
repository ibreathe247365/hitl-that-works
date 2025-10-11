// Calculator agent functionality

// Basic calculation operations
class Calculation {
  operation string // "add", "subtract", "multiply", "divide", "power", "sqrt"
  operands float[]
  result float
  expression string // The mathematical expression that was calculated
}

// Intent to perform a calculation
class IntentCalculate {
  intent "calculate"
  expression string // Mathematical expression to evaluate
  explanation string // Brief explanation of what the calculation does
}

// Intent to request clarification from human
class ClarificationRequest {
  intent "request_more_information"
  message string // What information is needed from the human
}

// Intent to indicate task is complete
class DoneForNow {
  intent "done_for_now"
  message string // Summary of what was accomplished
}

// Intent when no action is needed
class NothingToDo {
  intent "nothing_to_do"
  message string // Explanation of why no action is needed
}

// Intent to wait for a specified time
class Await {
  intent "await"
  seconds int
  reasoning string // Why we need to wait
}

// Main function to determine the next step
function DetermineNextStep(thread: string) -> ClarificationRequest | DoneForNow | IntentCalculate | NothingToDo | Await {
  client "openai-responses/gpt-5-mini"
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

// Function to perform calculations
function PerformCalculation(expression: string) -> Calculation {
  client "openai-responses/gpt-5-mini"
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

// Function to squash response context for error handling
function SquashResponseContext(thread: string, error: string) -> string {
  client "openai-responses/gpt-5-mini"
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
