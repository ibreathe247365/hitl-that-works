"use client";

import type { ThreadStateWithMetadata } from "@hitl/ai";
import { ActivityIcon, ClockIcon, DatabaseIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface RedisStatePanelProps {
	stateId: string;
}

export function RedisStatePanel({ stateId }: RedisStatePanelProps) {
	const [state, setState] = useState<ThreadStateWithMetadata | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
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

		fetchState();

		// Refresh every 5 seconds
		const interval = setInterval(fetchState, 5000);
		return () => clearInterval(interval);
	}, [stateId]);

	if (loading) {
		return (
			<Card className="h-full">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<DatabaseIcon className="h-5 w-5" />
						Redis State
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="py-8 text-center text-muted-foreground">
						Loading Redis state...
					</div>
				</CardContent>
			</Card>
		);
	}

	if (error) {
		return (
			<Card className="h-full">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<DatabaseIcon className="h-5 w-5" />
						Redis State
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="py-8 text-center text-destructive">
						Error: {error}
					</div>
				</CardContent>
			</Card>
		);
	}

	if (!state) {
		return (
			<Card className="h-full">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<DatabaseIcon className="h-5 w-5" />
						Redis State
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="py-8 text-center text-muted-foreground">
						No Redis state found
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="h-full">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<DatabaseIcon className="h-5 w-5" />
					Redis State
				</CardTitle>
			</CardHeader>
			<CardContent className="p-0">
				<ScrollArea className="h-[calc(100vh-200px)] p-4">
					<div className="space-y-4">
						{/* Metadata Section */}
						{state.metadata && (
							<div className="space-y-3">
								<h4 className="flex items-center gap-2 font-medium text-sm">
									<ActivityIcon className="h-4 w-4" />
									Processing Metadata
								</h4>
								<div className="space-y-2">
									{state.metadata.jobId && (
										<div className="flex items-center gap-2">
											<span className="text-muted-foreground text-xs">
												Job ID:
											</span>
											<Badge variant="outline" className="text-xs">
												{state.metadata.jobId}
											</Badge>
										</div>
									)}
									{state.metadata.processingAttempts && (
										<div className="flex items-center gap-2">
											<span className="text-muted-foreground text-xs">
												Attempts:
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
												Enqueued:{" "}
												{new Date(state.metadata.enqueuedAt).toLocaleString()}
											</span>
										</div>
									)}
									{state.metadata.lastProcessedAt && (
										<div className="flex items-center gap-2">
											<ClockIcon className="h-3 w-3 text-muted-foreground" />
											<span className="text-muted-foreground text-xs">
												Last Processed:{" "}
												{new Date(
													state.metadata.lastProcessedAt,
												).toLocaleString()}
											</span>
										</div>
									)}
								</div>
							</div>
						)}

						{/* Thread Events */}
						<div className="space-y-3">
							<h4 className="font-medium text-sm">
								Thread Events ({state.thread.events.length})
							</h4>
							<div className="space-y-2">
								{state.thread.events.map((event, index) => (
									<div key={index} className="rounded-md border p-2">
										<div className="mb-2 flex items-center gap-2">
											<Badge variant="outline" className="text-xs">
												{event.type}
											</Badge>
										</div>
										<pre className="overflow-x-auto rounded bg-muted p-2 text-xs">
											{JSON.stringify(event.data, null, 2)}
										</pre>
									</div>
								))}
							</div>
						</div>

						{/* Initial Email */}
						{state.thread.initial_email && (
							<div className="space-y-3">
								<h4 className="font-medium text-sm">Initial Email</h4>
								<div className="rounded-md border p-2">
									<pre className="overflow-x-auto rounded bg-muted p-2 text-xs">
										{JSON.stringify(state.thread.initial_email, null, 2)}
									</pre>
								</div>
							</div>
						)}

						{/* Raw State */}
						<div className="space-y-3">
							<h4 className="font-medium text-sm">Raw State</h4>
							<div className="rounded-md border p-2">
								<pre className="overflow-x-auto rounded bg-muted p-2 text-xs">
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
