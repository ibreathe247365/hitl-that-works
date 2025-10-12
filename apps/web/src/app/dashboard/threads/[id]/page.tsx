"use client";

import { api } from "@hitl/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { ArrowLeftIcon } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { EventChain } from "@/components/event-chain";
import { MessageInput } from "@/components/message-input";
import { RedisStatePanel } from "@/components/redis-state-panel";
import { Horizontal } from "@/components/resizable-panels";
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
				<div className="flex items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4">
					<Button
						variant="ghost"
						size="sm"
						onClick={() => router.push("/dashboard")}
						className="flex items-center gap-2 hover:bg-muted/50"
					>
						<ArrowLeftIcon className="h-4 w-4" />
					</Button>
				</div>
				<div className="flex-1 flex items-center justify-center">
					<div className="text-center">
						<div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
						<p className="text-muted-foreground">Loading thread...</p>
					</div>
				</div>
			</div>
		);
	}

	if (thread === null) {
		return (
			<div className="flex h-screen flex-col bg-background">
				<div className="flex items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4">
					<Button
						variant="ghost"
						size="sm"
						onClick={() => router.push("/dashboard")}
						className="flex items-center gap-2 hover:bg-muted/50"
					>
						<ArrowLeftIcon className="h-4 w-4" />
					</Button>
				</div>
				<div className="flex-1 flex items-center justify-center">
					<div className="text-center">
						<div className="mx-auto mb-4 h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
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
			{/* Header */}
			<div className="flex items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 py-4">
				<Button
					variant="ghost"
					size="sm"
					onClick={() => router.push("/dashboard")}
					className="flex items-center gap-2 hover:bg-muted/50 -ml-2"
				>
					<ArrowLeftIcon className="h-4 w-4" />
					<span className="hidden sm:inline">Back</span>
				</Button>
				<div className="flex items-center gap-4 min-w-0 flex-1">
					<div className="flex items-center gap-3 min-w-0">
						<h1 className="font-semibold text-xl truncate">Thread {stateId.slice(-8)}</h1>
						<Badge variant="secondary" className="text-xs flex-shrink-0">
							{thread.initial_email ? "Email" : "Chat"}
						</Badge>
					</div>
					<div className="h-5 w-px bg-border hidden sm:block"></div>
					<div className="text-muted-foreground text-sm flex-shrink-0">
						{thread.events.length} event{thread.events.length !== 1 ? "s" : ""}
					</div>
				</div>
			</div>

			{/* Main Content */}
			<div className="flex-1 flex flex-col overflow-hidden">
				{/* Main Content Area */}
				<div className="flex-1 min-h-0 p-4">
					<div className="h-full">
						{/* Desktop: Use resizable panels */}
						<div className="hidden lg:block h-full">
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
						<div className="lg:hidden h-full flex flex-col gap-4">
							<div className="flex-1 min-h-0">
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
					<MessageInput
						stateId={stateId}
						onMessageSent={handleMessageSent}
					/>
					<div className="px-6 py-3">
						<div className="mx-auto max-w-4xl">
							<div className="flex flex-col gap-2 text-muted-foreground text-xs sm:flex-row sm:items-center sm:justify-between sm:gap-4">
								<span>Last updated {formatDistanceToNow(new Date(thread.updatedAt), { addSuffix: true })}</span>
								<div className="flex items-center gap-2">
									<div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
									<span className="font-medium">Active</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
