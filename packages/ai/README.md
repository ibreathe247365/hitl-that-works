# Calculator Agent

A Human-in-the-Loop (HITL) calculator agent that processes mathematical calculations via email.

## Features

- **Email Integration**: Receives calculation requests via email
- **Mathematical Operations**: Supports basic arithmetic, powers, square roots, and complex expressions
- **Human-in-the-Loop**: Can request clarification from humans when expressions are unclear
- **Error Handling**: Provides clear error messages for invalid expressions
- **State Management**: Maintains conversation state across interactions
- **Flexible Contact Methods**: Designed to support multiple human contact methods (email, Slack, webhooks)

## Supported Operations

- Basic arithmetic: `+`, `-`, `*`, `/`
- Powers: `^` or `**`
- Square roots: `sqrt()`
- Parentheses for grouping
- Decimal numbers
- Mathematical constants: `pi`, `e`

## Usage

Send an email to the calculator agent with mathematical expressions in the body. Examples:

- `2 + 2`
- `(10 + 5) * 3`
- `sqrt(16)`
- `2^3`
- `pi * 2`

## Architecture

- **BAML**: Defines the AI functions and types
- **Agent**: Main processing logic for handling email threads
- **Calculator Tools**: Mathematical expression evaluation
- **Contact Management**: Flexible system for human contact (currently email-only)
- **State Management**: Persists conversation state

## Human Contact System

The agent uses a flexible contact system that can be extended to support multiple communication channels:

- **Email**: Currently implemented for basic email communication
- **Slack**: Ready for future implementation
- **Webhooks**: Ready for future implementation

When the agent needs human input, it creates a `HumanContactRequest` with the appropriate contact method and message.

## Files

- `agent.ts`: Main agent logic
- `vendored.ts`: Contact integration types
- `tools/calculator.ts`: Mathematical calculation utilities
- `baml_src/resume.baml`: BAML function definitions
- `state.ts`: Thread state management
