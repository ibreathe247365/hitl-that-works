"use client";

import { api } from "@hitl/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ThreadListPage() {
	const threads = useQuery(api.threads.getThreads);
	const router = useRouter();
	const [highlightedThreadId, setHighlightedThreadId] = useState<string | null>(
		null,
	);

	const user = useQuery(api.auth.getCurrentUser);

	useEffect(() => {
		const handlePendingMessage = async () => {
			const pendingMessage = sessionStorage.getItem("pendingMessage");
			if (pendingMessage && user?.email) {
				try {
					const response = await fetch("/api/thread/send-message", {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify({
							message: pendingMessage,
							email: user.email,
						}),
					});

					if (response.ok) {
						const result = await response.json();
						sessionStorage.removeItem("pendingMessage");

						// Highlight the newly created thread instead of navigating
						setHighlightedThreadId(result.data.stateId);

						// Remove highlight after 3 seconds
						setTimeout(() => {
							setHighlightedThreadId(null);
						}, 3000);
					}
				} catch (error) {
					console.error("Error sending pending message:", error);
					sessionStorage.removeItem("pendingMessage");
				}
			}
		};

		handlePendingMessage();
	}, [user]);

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
		<div className="min-h-screen bg-background">
			<div className="container mx-auto px-6 py-8">
				<div className="mb-8">
					<h1 className="mb-2 font-bold text-3xl">Your Threads</h1>
					<p className="text-lg text-muted-foreground">
						{threads.length} thread{threads.length !== 1 ? "s" : ""} total
					</p>
				</div>

				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
					{threads.map((thread) => {
						const isHighlighted = highlightedThreadId === thread.stateId;
						return (
							<Card
								key={thread.stateId}
								className={`group cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-lg ${
									isHighlighted ? "scale-[1.02] shadow-lg" : ""
								}`}
								onClick={() =>
									router.push(`/dashboard/threads/${thread.stateId}`)
								}
								style={
									isHighlighted
										? {
												background:
													"linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.05) 50%, rgba(59, 130, 246, 0.1) 100%)",
											}
										: undefined
								}
							>
								<CardHeader className="pb-3">
									<div className="flex items-center justify-between">
										<CardTitle className="truncate font-semibold text-base transition-colors group-hover:text-primary">
											Thread {thread.stateId.slice(-8)}
										</CardTitle>
										<Badge
											variant="secondary"
											className="flex-shrink-0 text-xs"
										>
											{thread.initialEmail ? "Email" : "Chat"}
										</Badge>
									</div>
								</CardHeader>
								<CardContent className="pt-0">
									<div className="space-y-3 text-muted-foreground text-sm">
										<div className="flex items-center gap-2">
											<div className="h-1.5 w-1.5 rounded-full bg-green-500" />
											<span>
												Created{" "}
												{formatDistanceToNow(new Date(thread.createdAt), {
													addSuffix: true,
												})}
											</span>
										</div>
										<div className="flex items-center gap-2">
											<div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
											<span>
												Updated{" "}
												{formatDistanceToNow(new Date(thread.updatedAt), {
													addSuffix: true,
												})}
											</span>
										</div>
										{thread.initialEmail && (
											<div className="truncate text-xs">
												<span className="font-medium">From:</span>{" "}
												{typeof thread.initialEmail === "string"
													? thread.initialEmail
													: "Email thread"}
											</div>
										)}
									</div>
								</CardContent>
							</Card>
						);
					})}
				</div>
			</div>
		</div>
	);
}
