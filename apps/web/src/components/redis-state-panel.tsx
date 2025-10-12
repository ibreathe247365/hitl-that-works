"use client";

import type { ThreadStateWithMetadata } from "@hitl/ai";
import { ActivityIcon, ClockIcon, DatabaseIcon, RefreshCwIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface RedisStatePanelProps {
	stateId: string;
}

export function RedisStatePanel({ stateId }: RedisStatePanelProps) {
	const [state, setState] = useState<ThreadStateWithMetadata | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchState = async () => {
		try {
			setLoading(true);
			const response = await fetch(`/api/redis/${stateId}`);

			if (!response.ok) {
				throw new Error("Failed to fetch Redis state");
			}

			const data = await response.json();
			setState(data);
			setError(null);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Unknown error");
			setState(null);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchState();

		// Refresh every 15 seconds
		const interval = setInterval(fetchState, 15000);
		return () => clearInterval(interval);
	}, [stateId]);

	if (loading) {
		return (
			<Card className="h-full">
				<CardHeader className="pb-4">
					<CardTitle className="flex items-center gap-2 text-lg">
						<DatabaseIcon className="h-5 w-5 text-primary" />
						Redis State
					</CardTitle>
				</CardHeader>
				<CardContent className="flex-1 flex items-center justify-center">
					<div className="py-12 text-center">
						<div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
						<p className="text-muted-foreground">Loading Redis state...</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	if (error) {
		return (
			<Card className="h-full">
				<CardHeader className="pb-4">
					<CardTitle className="flex items-center gap-2 text-lg">
						<DatabaseIcon className="h-5 w-5 text-primary" />
						Redis State
					</CardTitle>
				</CardHeader>
				<CardContent className="flex-1 flex items-center justify-center">
					<div className="py-12 text-center max-w-sm mx-auto">
						<div className="mx-auto mb-6 h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
							<DatabaseIcon className="h-8 w-8 text-destructive" />
						</div>
						<h3 className="font-semibold text-lg mb-2">Redis Connection Error</h3>
						<p className="text-muted-foreground mb-4 text-sm">
							{error.includes("Failed to fetch") 
								? "Unable to connect to Redis. This might be due to missing environment variables or Redis not being configured."
								: error
							}
						</p>
						<div className="rounded-lg bg-muted/50 p-4 border border-dashed mb-4">
							<p className="text-muted-foreground text-xs">
								Thread data is still available through the database. Redis is used for real-time state management.
							</p>
						</div>
						<Button
							variant="outline"
							size="sm"
							onClick={fetchState}
							className="w-full"
						>
							<RefreshCwIcon className="mr-2 h-4 w-4" />
							Retry Connection
						</Button>
					</div>
				</CardContent>
			</Card>
		);
	}

	if (!state) {
		return (
			<Card className="h-full">
				<CardHeader className="pb-4">
					<CardTitle className="flex items-center gap-2 text-lg">
						<DatabaseIcon className="h-5 w-5 text-primary" />
						Redis State
					</CardTitle>
				</CardHeader>
				<CardContent className="flex-1 flex items-center justify-center">
					<div className="py-12 text-center">
						<div className="mx-auto mb-4 h-16 w-16 rounded-full bg-muted flex items-center justify-center">
							<DatabaseIcon className="h-8 w-8 text-muted-foreground" />
						</div>
						<h3 className="font-semibold text-lg mb-2">No Redis state found</h3>
						<p className="text-muted-foreground text-sm">
							This thread doesn't have any Redis state data yet.
						</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="h-full">
			<CardHeader className="pb-4">
				<CardTitle className="flex items-center gap-2 text-lg">
					<DatabaseIcon className="h-5 w-5 text-primary" />
					Redis State
				</CardTitle>
			</CardHeader>
			<CardContent className="p-0 flex-1 min-h-0">
				<ScrollArea className="h-full px-6 pb-6">
					<div className="space-y-6">
						{/* Metadata Section */}
						{/* {state.metadata && (
							<div className="space-y-4">
								<h4 className="flex items-center gap-2 font-semibold text-sm text-foreground">
									<ActivityIcon className="h-4 w-4 text-primary" />
									Processing Metadata
								</h4>
								<div className="space-y-3">
									{state.metadata.jobId && (
										<div className="flex items-center justify-between">
											<span className="text-muted-foreground text-xs font-medium">
												Job ID
											</span>
											<Badge variant="outline" className="text-xs font-mono">
												{state.metadata.jobId}
											</Badge>
										</div>
									)}
									{state.metadata.processingAttempts && (
										<div className="flex items-center justify-between">
											<span className="text-muted-foreground text-xs font-medium">
												Attempts
											</span>
											<Badge variant="secondary" className="text-xs">
												{state.metadata.processingAttempts}
											</Badge>
										</div>
									)}
									{state.metadata.enqueuedAt && (
										<div className="flex items-center gap-2">
											<ClockIcon className="h-3 w-3 text-muted-foreground" />
											<span className="text-muted-foreground text-xs">
												Enqueued{" "}
												{formatDistanceToNow(new Date(state.metadata.enqueuedAt), { addSuffix: true })}
											</span>
										</div>
									)}
									{state.metadata.lastProcessedAt && (
										<div className="flex items-center gap-2">
											<ClockIcon className="h-3 w-3 text-muted-foreground" />
											<span className="text-muted-foreground text-xs">
												Last Processed{" "}
												{formatDistanceToNow(new Date(state.metadata.lastProcessedAt), { addSuffix: true })}
											</span>
										</div>
									)}
								</div>
							</div>
						)} */}

						{/* Thread Events */}
						<div className="space-y-4">
							<h4 className="font-semibold text-sm text-foreground">
								Thread Events ({state.thread.events.length})
							</h4>
							<div className="space-y-3">
								{state.thread.events.map((event, index) => (
									<div key={index} className="rounded-lg border bg-card p-3">
										<div className="mb-3 flex items-center gap-2">
											<Badge variant="outline" className="text-xs">
												{event.type}
											</Badge>
										</div>
										<pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs leading-relaxed whitespace-pre-wrap break-words max-w-full">
											{JSON.stringify(event.data, null, 2)}
										</pre>
									</div>
								))}
							</div>
						</div>

						{/* Initial Email */}
						{state.thread.initial_email && (
							<div className="space-y-4">
								<h4 className="font-semibold text-sm text-foreground">Initial Email</h4>
								<div className="rounded-lg border bg-card p-3">
									<pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs leading-relaxed whitespace-pre-wrap break-words max-w-full">
										{JSON.stringify(state.thread.initial_email, null, 2)}
									</pre>
								</div>
							</div>
						)}

						{/* Raw State */}
						<div className="space-y-4">
							<h4 className="font-semibold text-sm text-foreground">Raw State</h4>
							<div className="rounded-lg border bg-card p-3">
								<pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs leading-relaxed whitespace-pre-wrap break-words max-w-full">
									{JSON.stringify(state, null, 2)}
								</pre>
							</div>
						</div>
					</div>
				</ScrollArea>
			</CardContent>
		</Card>
	);
}
