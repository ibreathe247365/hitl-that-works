import { nextJsHandler } from "@convex-dev/better-auth/nextjs";
import { logger, extractRequestContext } from "@/lib/logger";
import type { NextRequest } from "next/server";

const { GET: originalGET, POST: originalPOST } = nextJsHandler();

export async function GET(request: NextRequest) {
	const requestContext = logger.logRequestStart(request);
	const startTime = Date.now();

	try {
		logger.info("Auth GET request", requestContext);
		const response = await originalGET(request);
		const duration = Date.now() - startTime;
		logger.logRequestEnd(requestContext, response.status, duration);
		return response;
	} catch (error) {
		const duration = Date.now() - startTime;
		logger.error("Auth GET request failed", {
			...requestContext,
			duration: `${duration}ms`,
		}, error instanceof Error ? error : new Error(String(error)));
		logger.logRequestEnd(requestContext, 500, duration);
		throw error;
	}
}

export async function POST(request: NextRequest) {
	const requestContext = logger.logRequestStart(request);
	const startTime = Date.now();

	try {
		logger.info("Auth POST request", requestContext);
		const response = await originalPOST(request);
		const duration = Date.now() - startTime;
		logger.logRequestEnd(requestContext, response.status, duration);
		return response;
	} catch (error) {
		const duration = Date.now() - startTime;
		logger.error("Auth POST request failed", {
			...requestContext,
			duration: `${duration}ms`,
		}, error instanceof Error ? error : new Error(String(error)));
		logger.logRequestEnd(requestContext, 500, duration);
		throw error;
	}
}
