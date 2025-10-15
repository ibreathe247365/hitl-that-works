import { getThreadStateWithMetadata, updateThreadState } from "@hitl/ai";
import { enqueueWebhookProcessing, addThreadEvent } from "@hitl/ai";
import { RollbackAgentEventSchema, ThreadSchema } from "@hitl/ai";
import { z } from "zod";
import { type NextRequest, NextResponse } from "next/server";
import {
	logger,
	measureExecutionTime,
} from "@/lib/logger";

const UpdateStateRequestSchema = z.object({
	thread: ThreadSchema,
});

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ stateId: string }> },
) {
	const requestContext = logger.logRequestStart(request);
	const startTime = Date.now();

	try {
		const { stateId } = await params;

		logger.debug("Fetching Redis state", {
			...requestContext,
			stateId,
		});

		if (!stateId) {
			logger.logValidationError(
				requestContext,
				"stateId",
				stateId,
				"StateId is required",
			);
			return NextResponse.json(
				{ error: "StateId is required" },
				{ status: 400 },
			);
		}

		const threadState = await measureExecutionTime(
			() => getThreadStateWithMetadata(stateId),
			requestContext,
			"Get thread state with metadata",
		);

		if (!threadState) {
			logger.warn("Thread state not found", {
				...requestContext,
				stateId,
			});
			return NextResponse.json({ thread: { events: [] } });
		}

		logger.info("Thread state retrieved successfully", {
			...requestContext,
			stateId,
			hasThreadState: !!threadState,
		});

		const duration = Date.now() - startTime;
		logger.logRequestEnd(requestContext, 200, duration);

		return NextResponse.json(threadState);
	} catch (error) {
		const duration = Date.now() - startTime;
		logger.error(
			"Error fetching Redis state",
			{
				...requestContext,
				duration: `${duration}ms`,
			},
			error instanceof Error ? error : new Error(String(error)),
		);

		logger.logRequestEnd(requestContext, 500, duration);

		return NextResponse.json({ thread: { events: [] } });
	}
}

export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ stateId: string }> },
) {
	const requestContext = logger.logRequestStart(request);
	const startTime = Date.now();

	try {
		const { stateId } = await params;

		if (!stateId) {
			logger.logValidationError(
				requestContext,
				"stateId",
				stateId,
				"StateId is required",
			);
			return NextResponse.json(
				{ error: "StateId is required" },
				{ status: 400 },
			);
		}

		const body = await request.json();
		
		const validationResult = UpdateStateRequestSchema.safeParse(body);
		if (!validationResult.success) {
			logger.logValidationError(
				requestContext,
				"request body",
				body,
				"Invalid request body format",
			);
			return NextResponse.json(
				{ 
					error: "Invalid request body format",
					details: validationResult.error.issues.map(issue => ({
						field: issue.path.join("."),
						message: issue.message,
					}))
				},
				{ status: 400 },
			);
		}

		const { thread } = validationResult.data;

		await measureExecutionTime(
			() => updateThreadState(stateId, thread),
			requestContext,
			"Update thread state",
		);

		const rollbackEventData = {
			type: "rollback-agent" as const,
			data: {
				message: "The human made changes to the context, re-evaluate with this changed information",
				timestamp: new Date().toISOString(),
			},
		};

		const rollbackEvent = RollbackAgentEventSchema.parse(rollbackEventData);

		await measureExecutionTime(
			() => Promise.resolve(addThreadEvent(stateId, rollbackEvent)),
			requestContext,
			"Add rollback event to database",
		);

		const jobId = await measureExecutionTime(
			() => enqueueWebhookProcessing(
				{
					type: "human_contact.completed",
					event: {
						status: {
							response: "The human made changes to the context, re-evaluate with this changed information",
						},
						state: {
							stateId: stateId,
						},
					},
				},
				stateId
			),
			requestContext,
			"Enqueue webhook processing",
		);

		logger.info("Thread state updated successfully", {
			...requestContext,
			stateId,
			jobId,
		});

		const duration = Date.now() - startTime;
		logger.logRequestEnd(requestContext, 200, duration);

		return NextResponse.json({ 
			success: true, 
			jobId,
			message: "State updated and webhook queued successfully" 
		});
	} catch (error) {
		const duration = Date.now() - startTime;
		logger.error(
			"Error updating Redis state",
			{
				...requestContext,
				duration: `${duration}ms`,
			},
			error instanceof Error ? error : new Error(String(error)),
		);

		logger.logRequestEnd(requestContext, 500, duration);

		return NextResponse.json(
			{ error: "Failed to update thread state" },
			{ status: 500 },
		);
	}
}
