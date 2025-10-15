"use client";

import type { Event } from "@hitl/ai/schemas";
import type { ReactElement } from "react";
import { Badge } from "@/components/ui/badge";
import { Task, TaskContent, TaskItem, TaskTrigger } from "@/components/ai-elements/task";

export function ThreadCreatedContent({ event }: { event: Event }): ReactElement {
    const data = (event.data as any) ?? {};
    return (
        <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
                <h4 className="font-medium text-sm">Thread Created</h4>
                {data.userId && (
                    <Badge variant="outline" title={String(data.userId)}>
                        {String(data.userId).slice(0, 8)}
                    </Badge>
                )}
            </div>
            {data.message && (
                <p className="text-muted-foreground">{String(data.message)}</p>
            )}
        </div>
    );
}

export function ThreadCreatedStep({ event }: { event: Event }): ReactElement {
    return (
        <Task defaultOpen={false}>
            <TaskTrigger title="Thread Created" />
            <TaskContent>
                <TaskItem>
                    <ThreadCreatedContent event={event} />
                </TaskItem>
            </TaskContent>
        </Task>
    );
}
