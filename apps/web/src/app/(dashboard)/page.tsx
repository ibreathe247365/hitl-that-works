"use client";

import { api } from "@hitl/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";

export default function ThreadListPage() {
  const threads = useQuery(api.threads.getThreads);
  const router = useRouter();

  if (threads === undefined) {
    return (
      <div className="p-6">
        <div className="text-center">Loading threads...</div>
      </div>
    );
  }

  if (threads.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center text-muted-foreground">
          No threads yet. Create your first thread to get started!
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Your Threads</h1>
        <p className="text-muted-foreground">
          {threads.length} thread{threads.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {threads.map((thread) => (
          <Card
            key={thread.stateId}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push(`/threads/${thread.stateId}`)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium truncate">
                  Thread {thread.stateId.slice(-8)}
                </CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {thread.initialEmail ? 'Email' : 'Chat'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2 text-sm text-muted-foreground">
                <div>
                  Created {formatDistanceToNow(new Date(thread.createdAt), { addSuffix: true })}
                </div>
                <div>
                  Updated {formatDistanceToNow(new Date(thread.updatedAt), { addSuffix: true })}
                </div>
                {thread.initialEmail && (
                  <div className="truncate">
                    From: {typeof thread.initialEmail === 'string' ? thread.initialEmail : 'Email thread'}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
