# hitl

This project was created with [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack), a modern TypeScript stack that combines Next.js, Convex, and more.

## Features

- **TypeScript** - For type safety and improved developer experience
- **Next.js** - Full-stack React framework
- **TailwindCSS** - Utility-first CSS for rapid UI development
- **shadcn/ui** - Reusable UI components
- **Convex** - Reactive backend-as-a-service platform
- **Authentication** - Better-Auth
- **Biome** - Linting and formatting
- **Turborepo** - Optimized monorepo build system

## Getting Started

First, install the dependencies:

```bash
pnpm install
```

## Convex Setup

This project uses Convex as a backend. You'll need to set up Convex before running the app:

```bash
pnpm dev:setup
```

Follow the prompts to create a new Convex project and connect it to your application.

Then, run the development server:

```bash
pnpm dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser to see the web application.
Your app will connect to the Convex cloud backend automatically.







## Project Structure

```
hitl/
├── apps/
│   ├── web/         # Frontend application (Next.js)
├── packages/
│   ├── backend/     # Convex backend functions and schema
```

## Available Scripts

- `pnpm dev`: Start all applications in development mode
- `pnpm build`: Build all applications
- `pnpm dev:web`: Start only the web application
- `pnpm dev:setup`: Setup and configure your Convex project
- `pnpm check-types`: Check TypeScript types across all apps
- `pnpm check`: Run Biome formatting and linting

## Email approvals (Slack-like)

To enable email-based approvals mirroring Slack buttons:

- Required env:
  - `RESEND_API_KEY`
  - `NEXT_PUBLIC_APP_URL` (e.g. `https://your.app`)
- Usage:
  - Call `sendEmailFunctionApprovalRequest(message, { email: { address } }, stateId, fn, kwargs)` from `@hitl/ai`.
  - Approve/Deny/Custom links route to `/api/webhooks/human-response` which enqueues a `function_call.completed` event.
  - Replies to the email can be ingested to produce `human_contact.completed` via `createEmailWebhookPayload`.

Dev test endpoint:

POST `apps/web/src/app/api/test-email/route.ts` with JSON:

```json
{ "stateId": "test-state-id", "fn": "example_function", "kwargs": { "k": true }, "message": "Please approve." }
```
