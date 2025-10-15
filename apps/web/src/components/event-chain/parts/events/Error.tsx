"use client";

import type { Event } from "@hitl/ai/schemas";
import type { ReactElement } from "react";

export function ErrorEventContent({ event }: { event: Event }): ReactElement {
	const data = (event.data as any) ?? {};
	return (
		<div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-800 text-sm">
			{typeof data === "string" ? (
				data
			) : (
				<pre className="whitespace-pre-wrap break-words text-xs">
					{JSON.stringify(data, null, 2)}
				</pre>
			)}
		</div>
	);
}

export function ErrorEventStep({ event }: { event: Event }): ReactElement {
	return (
		<div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-800 text-xs">
			<ErrorEventContent event={event} />
		</div>
	);
}
