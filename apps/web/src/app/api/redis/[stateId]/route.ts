import {
	addThreadEvent,
	enqueueWebhookProcessing,
	getThreadStateWithMetadata,
	RollbackAgentEventSchema,
	ThreadSchema,
	updateThreadState,
} from "@hitl/ai";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const UpdateStateRequestSchema = z.object({
	thread: ThreadSchema,
});

export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ stateId: string }> },
) {
	try {
		const { stateId } = await params;

		if (!stateId) {
			return NextResponse.json(
				{ error: "StateId is required" },
				{ status: 400 },
			);
		}

		const threadState = await getThreadStateWithMetadata(stateId);

		if (!threadState) {
			return NextResponse.json({ thread: { events: [] } });
		}

		return NextResponse.json(threadState);
	} catch (_error) {
		return NextResponse.json({ thread: { events: [] } });
	}
}

export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ stateId: string }> },
) {
	try {
		const { stateId } = await params;

		if (!stateId) {
			return NextResponse.json(
				{ error: "StateId is required" },
				{ status: 400 },
			);
		}

		const body = await request.json();

		const validationResult = UpdateStateRequestSchema.safeParse(body);
		if (!validationResult.success) {
			return NextResponse.json(
				{
					error: "Invalid request body format",
					details: validationResult.error.issues.map((issue) => ({
						field: issue.path.join("."),
						message: issue.message,
					})),
				},
				{ status: 400 },
			);
		}

		const { thread } = validationResult.data;

		await updateThreadState(stateId, thread);

		const rollbackEventData = {
			type: "rollback-agent" as const,
			data: {
				message:
					"The human made changes to the context, re-evaluate with this changed information",
				timestamp: new Date().toISOString(),
			},
		};

		const rollbackEvent = RollbackAgentEventSchema.parse(rollbackEventData);

		await Promise.resolve(addThreadEvent(stateId, rollbackEvent));

		const jobId = await enqueueWebhookProcessing(
			{
				type: "human_contact.completed",
				event: {
					status: {
						response:
							"The human made changes to the context, re-evaluate with this changed information",
					},
					state: {
						stateId: stateId,
					},
				},
			},
			stateId,
		);

		return NextResponse.json({
			success: true,
			jobId,
			message: "State updated and webhook queued successfully",
		});
	} catch (_error) {
		return NextResponse.json(
			{ error: "Failed to update thread state" },
			{ status: 500 },
		);
	}
}
