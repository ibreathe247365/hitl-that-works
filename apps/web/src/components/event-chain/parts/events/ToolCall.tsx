"use client";

import type { Event } from "@hitl/ai/schemas";
import type { ReactElement } from "react";
import {
	Tool,
	ToolContent,
	ToolHeader,
	ToolInput,
	ToolOutput,
} from "@/components/ai-elements/tool";

export function ToolCallContent({ event }: { event: Event }): ReactElement {
	return (
		<Tool defaultOpen={false}>
			<ToolHeader
				title={(event.data as any).name || (event.data as any).function_name}
				type={`tool-${event.type}` as const}
				state={
					((event.data as any).status === "in_progress" && "input-streaming") ||
					((event.data as any).status === "succeeded" && "output-available") ||
					((event.data as any).status === "failed" && "output-error") ||
					"input-available"
				}
			/>
			<ToolContent>
				<ToolInput
					input={(event.data as any).arguments || (event.data as any).input}
				/>
				<ToolOutput
					output={(event.data as any).result || (event.data as any).output}
					errorText={(event.data as any).error}
				/>
			</ToolContent>
		</Tool>
	);
}
