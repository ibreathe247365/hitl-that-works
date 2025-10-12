import { getThreadStateWithMetadata } from "@hitl/ai";
import { type NextRequest, NextResponse } from "next/server";

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
			return NextResponse.json(
				{ error: "Thread state not found" },
				{ status: 404 },
			);
		}

		return NextResponse.json(threadState);
	} catch (error) {
		console.error("Error fetching Redis state:", error);
		return NextResponse.json(
			{ error: "Failed to fetch thread state" },
			{ status: 500 },
		);
	}
}
