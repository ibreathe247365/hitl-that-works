"use client";

import { api } from "@hitl/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { useParams, useRouter } from "next/navigation";
import { MessageInput } from "@/components/message-input";
import { EventChain } from "@/components/event-chain";
import { RedisStatePanel } from "@/components/redis-state-panel";
import { Vertical, Horizontal } from "@/components/resizable-panels";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ThreadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const stateId = params.id as string;
  
  const thread = useQuery(api.threads.getThread, { stateId });

  const handleMessageSent = (newStateId: string) => {
    // Navigate to the new stateId if it's different
    if (newStateId !== stateId) {
      router.push(`/threads/${newStateId}`);
    }
  };

  if (thread === undefined) {
    return (
      <div className="p-6">
        <div className="text-center">Loading thread...</div>
      </div>
    );
  }

  if (thread === null) {
    return (
      <div className="p-6">
        <div className="text-center text-destructive">
          Thread not found or you don't have access to it.
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/")}
          className="flex items-center gap-2"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Threads
        </Button>
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">
            Thread {stateId.slice(-8)}
          </h1>
          <Badge variant="secondary" className="text-xs">
            {thread.initial_email ? 'Email' : 'Chat'}
          </Badge>
        </div>
      </div>

      {/* Main Content with Resizable Panels */}
      <div className="flex-1 overflow-hidden">
        <Vertical defaultLayout={[15, 80, 5]}>
          {/* Top: Message Input */}
          <div className="min-h-0">
            <MessageInput 
              stateId={stateId} 
              onMessageSent={handleMessageSent}
            />
          </div>

          {/* Middle: Event Chain and Redis State */}
          <div className="min-h-0">
            <Horizontal defaultLayout={[60, 40]}>
              <div className="min-h-0">
                <EventChain events={thread.events} />
              </div>
              <div className="min-h-0">
                <RedisStatePanel stateId={stateId} />
              </div>
            </Horizontal>
          </div>

          {/* Bottom: Additional Info (minimized for now) */}
          <div className="min-h-0">
            <Card className="h-full">
              <CardContent className="p-2">
                <div className="text-xs text-muted-foreground text-center">
                  Thread created {new Date(thread.createdAt).toLocaleString()} • 
                  Last updated {new Date(thread.updatedAt).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </div>
        </Vertical>
      </div>
    </div>
  );
}
