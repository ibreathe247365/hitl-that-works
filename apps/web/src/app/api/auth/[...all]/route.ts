import { nextJsHandler } from "@convex-dev/better-auth/nextjs";
import type { NextRequest } from "next/server";

const { GET: originalGET, POST: originalPOST } = nextJsHandler();

export async function GET(request: NextRequest) {
	try {
		const response = await originalGET(request);
		return response;
	} catch (error) {
		throw error;
	}
}

export async function POST(request: NextRequest) {
	try {
		const response = await originalPOST(request);
		return response;
	} catch (error) {
		throw error;
	}
}
