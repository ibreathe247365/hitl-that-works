"use client";

import type { Event } from "@hitl/ai/schemas";
import type { ReactElement } from "react";
import { Badge } from "@/components/ui/badge";

export function HumanContactSentContent({ event }: { event: Event }): ReactElement {
    const data = (event.data as any) ?? {};
    return (
        <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
                <h4 className="font-medium text-sm">Human Contact Sent</h4>
                {data.channelType && <Badge variant="outline">{String(data.channelType)}</Badge>}
            </div>
            {data.messageId && (
                <div className="text-xs">
                    <span className="text-muted-foreground">Message ID: </span>
                    <code className="rounded bg-muted/50 px-2 py-0.5">{String(data.messageId)}</code>
                </div>
            )}
            {data.error && (
                <div className="rounded border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive">
                    {String(data.error)}
                </div>
            )}
        </div>
    );
}

export function HumanContactSentStep({ event }: { event: Event }): ReactElement {
    return <HumanContactSentContent event={event} />;
}


