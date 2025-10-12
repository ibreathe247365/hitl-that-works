"use client";

import { api } from "@hitl/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { ArrowLeftIcon } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { EventChain } from "@/components/event-chain";
import { MessageInput } from "@/components/message-input";
import { RedisStatePanel } from "@/components/redis-state-panel";
import { Horizontal, Vertical } from "@/components/resizable-panels";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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
		<div className="flex h-screen flex-col">
			{/* Header */}
			<div className="flex items-center gap-4 border-b p-4">
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
					<h1 className="font-semibold text-lg">Thread {stateId.slice(-8)}</h1>
					<Badge variant="secondary" className="text-xs">
						{thread.initial_email ? "Email" : "Chat"}
					</Badge>
				</div>
			</div>

			{/* Main Content with Resizable Panels */}
			<div className="flex-1 overflow-hidden">
				<Vertical 
					defaultLayout={[15, 80, 5]}
					top={
						<div className="min-h-0">
							<MessageInput stateId={stateId} onMessageSent={handleMessageSent} />
						</div>
					}
					middle={
						<div className="min-h-0">
							<Horizontal 
								defaultLayout={[60, 40]}
								left={
									<div className="min-h-0">
										<EventChain events={thread.events} />
									</div>
								}
								right={
									<div className="min-h-0">
										<RedisStatePanel stateId={stateId} />
									</div>
								}
							/>
						</div>
					}
					bottom={
						<div className="min-h-0">
							<Card className="h-full">
								<CardContent className="p-2">
									<div className="text-center text-muted-foreground text-xs">
										Thread created {new Date(thread.createdAt).toLocaleString()} •
										Last updated {new Date(thread.updatedAt).toLocaleString()}
									</div>
								</CardContent>
							</Card>
						</div>
					}
				/>
			</div>
		</div>
	);
}
