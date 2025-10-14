"use client";

import { api } from "@hitl/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeftIcon } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { EventChain } from "@/components/event-chain";
import { MessageInput } from "@/components/message-input";
import { RedisStatePanel } from "@/components/redis-state-panel";
import { Horizontal } from "@/components/resizable-panels";
import { EventChainSkeleton } from "@/components/skeletons/event-chain";
import { RedisStatePanelSkeleton } from "@/components/skeletons/redis-panel";
import { ThreadDetailHeaderSkeleton } from "@/components/skeletons/thread-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function ThreadDetailPage() {
	const params = useParams();
	const router = useRouter();
	const stateId = params.id as string;

	const thread = useQuery(api.threads.getThread, { stateId });

	const handleMessageSent = (newStateId: string) => {
		// Navigate to the new stateId if it's different
		if (newStateId !== stateId) {
			router.push(`/dashboard/threads/${newStateId}`);
		}
	};

	if (thread === undefined) {
		return (
			<div className="flex h-screen flex-col bg-background">
				<ThreadDetailHeaderSkeleton />
				<div className="flex flex-1 gap-4 p-4">
					<div className="hidden h-full min-w-0 flex-1 lg:block">
						<EventChainSkeleton />
					</div>
					<div className="h-full min-w-0 flex-1 lg:w-2/5">
						<RedisStatePanelSkeleton />
					</div>
				</div>
			</div>
		);
	}

	if (thread === null) {
		return (
			<div className="flex h-screen flex-col bg-background">
				<div className="flex items-center gap-4 border-b bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
					<Button
						variant="ghost"
						size="sm"
						onClick={() => router.push("/dashboard")}
						className="flex items-center gap-2 hover:bg-muted/50"
					>
						<ArrowLeftIcon className="h-4 w-4" />
					</Button>
				</div>
				<div className="flex flex-1 items-center justify-center">
					<div className="text-center">
						<div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
							<ArrowLeftIcon className="h-6 w-6 text-destructive" />
						</div>
						<h3 className="mb-2 font-semibold text-lg">Thread Not Found</h3>
						<p className="text-muted-foreground">
							This thread doesn't exist or you don't have access to it.
						</p>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="flex h-screen flex-col bg-background">
			<div className="flex items-center gap-4 border-b bg-background/95 px-6 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
				<Button
					variant="ghost"
					size="sm"
					onClick={() => router.push("/dashboard")}
					className="-ml-2 flex items-center gap-2 rounded-full hover:bg-muted/50"
				>
					<ArrowLeftIcon className="h-4 w-4" />
				</Button>
				<div className="flex min-w-0 flex-1 items-center gap-4">
					<div className="flex min-w-0 items-center gap-3">
						<h1 className="truncate font-semibold text-xl">
							Thread {stateId.slice(-8)}
						</h1>
						<Badge variant="secondary" className="flex-shrink-0 text-xs">
							{thread.initial_email ? "Email" : "Chat"}
						</Badge>
					</div>
					<div className="hidden h-5 w-px bg-border sm:block" />
					<div className="flex-shrink-0 text-muted-foreground text-sm">
						{thread.events.length} event{thread.events.length !== 1 ? "s" : ""}
					</div>
				</div>
			</div>

			{/* Main Content */}
			<div className="flex flex-1 flex-col overflow-hidden">
				{/* Main Content Area */}
				<div className="min-h-0 flex-1 p-4">
					<div className="h-full">
						{/* Desktop: Use resizable panels */}
						<div className="hidden h-full lg:block">
							<Horizontal
								defaultLayout={[60, 40]}
								left={
									<div className="h-full min-h-0 min-w-0">
										<EventChain events={thread.events} />
									</div>
								}
								right={
									<div className="h-full min-h-0">
										<RedisStatePanel stateId={stateId} />
									</div>
								}
							/>
						</div>

						{/* Mobile/Tablet: Stack vertically */}
						<div className="flex h-full flex-col gap-4 lg:hidden">
							<div className="min-h-0 flex-1">
								<EventChain events={thread.events} />
							</div>
							<div className="h-80 flex-shrink-0">
								<RedisStatePanel stateId={stateId} />
							</div>
						</div>
					</div>
				</div>

				{/* Bottom Input Area */}
				<div className="flex-shrink-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
					<MessageInput stateId={stateId} onMessageSent={handleMessageSent} />
					<div className="px-6 py-3">
						<div className="mx-auto max-w-4xl">
							<div className="flex flex-col gap-2 text-muted-foreground text-xs sm:flex-row sm:items-center sm:justify-between sm:gap-4">
								<span>
									Last updated{" "}
									{formatDistanceToNow(new Date(thread.updatedAt), {
										addSuffix: true,
									})}
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
