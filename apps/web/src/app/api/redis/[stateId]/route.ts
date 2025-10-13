import { getThreadStateWithMetadata } from "@hitl/ai";
import { type NextRequest, NextResponse } from "next/server";
import {
	extractRequestContext,
	logger,
	measureExecutionTime,
} from "@/lib/logger";

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
			return NextResponse.json(
				{ error: "Thread state not found" },
				{ status: 404 },
			);
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

		return NextResponse.json(
			{ error: "Failed to fetch thread state" },
			{ status: 500 },
		);
	}
}
