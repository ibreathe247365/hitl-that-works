"use client";

import type { Thread, ThreadStateWithMetadata } from "@hitl/ai";
import {
	DatabaseIcon,
	EditIcon,
	RefreshCwIcon,
	SaveIcon,
	XIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
// import { RedisStateEditor } from "./redis-state-editor";
import { RedisStateModal } from "@/components/redis-state-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface RedisStatePanelProps {
	stateId: string;
}

export function RedisStatePanel({ stateId }: RedisStatePanelProps) {
	const [state, setState] = useState<ThreadStateWithMetadata | null>(null);
	const [loading, setLoading] = useState(true);
	const [isRefetching, setIsRefetching] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [isModalOpen, setIsModalOpen] = useState(false);
	// const [editMode, setEditMode] = useState<"json" | "form">("json");

	const fetchState = async (isInitialLoad = false) => {
		try {
			if (isInitialLoad) {
				setLoading(true);
			} else {
				setIsRefetching(true);
			}

			const response = await fetch(`/api/redis/${stateId}`);

			if (!response.ok) {
				throw new Error("Failed to fetch Agent context");
			}

			const data = await response.json();
			setState(data);
			setError(null);
		} catch (err) {
			if (isInitialLoad) {
				setError(err instanceof Error ? err.message : "Unknown error");
				setState(null);
			}
		} finally {
			setLoading(false);
			setIsRefetching(false);
		}
	};

	const handleEdit = () => {
		setIsModalOpen(true);
	};

	const handleModalClose = () => {
		setIsModalOpen(false);
	};

	const handleSaveSuccess = async () => {
		setIsModalOpen(false);
		await fetchState(false);
	};

	useEffect(() => {
		fetchState(true);

		const interval = setInterval(() => fetchState(false), 15000);
		return () => clearInterval(interval);
	}, [stateId]);

	if (loading) {
		return (
			<Card className="h-full">
				<CardHeader className="pt-1 pb-1">
					<CardTitle className="flex items-center gap-2 text-base">
						<DatabaseIcon className="h-4 w-4 text-primary" />
						Agent context
					</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-1 items-center justify-center">
					<div className="py-8 text-center">
						<div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
						<p className="text-muted-foreground text-sm">
							Loading Agent context...
						</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	if (error) {
		return (
			<Card className="h-full">
				<CardHeader className="pt-1 pb-1">
					<CardTitle className="flex items-center gap-2 text-base">
						<DatabaseIcon className="h-4 w-4 text-primary" />
						Agent context
					</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-1 items-center justify-center">
					<div className="mx-auto max-w-sm text-center">
						<div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
							<DatabaseIcon className="h-6 w-6 text-destructive" />
						</div>
						<h3 className="mb-2 font-semibold text-base">
							Redis Connection Error
						</h3>
						<p className="mb-3 text-muted-foreground text-sm">
							{error.includes("Failed to fetch")
								? "Unable to connect to Redis. This might be due to missing environment variables or Redis not being configured."
								: error}
						</p>
						<div className="mb-3 rounded-md border border-dashed bg-muted/50 p-3">
							<p className="text-muted-foreground text-xs">
								Thread data is still available through the database. Redis is
								used for real-time state management.
							</p>
						</div>
						<Button
							variant="outline"
							size="sm"
							onClick={() => fetchState(true)}
							className="w-full"
						>
							<RefreshCwIcon className="mr-2 h-3.5 w-3.5" />
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
				<CardHeader className="pt-1 pb-1">
					<CardTitle className="flex items-center gap-2 text-base">
						<DatabaseIcon className="h-4 w-4 text-primary" />
						Agent context
					</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-1 items-center justify-center">
					<div className="py-8 text-center">
						<div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
							<DatabaseIcon className="h-6 w-6 text-muted-foreground" />
						</div>
						<h3 className="mb-2 font-semibold text-base">
							No Agent context found
						</h3>
						<p className="text-muted-foreground text-sm">
							This thread doesn't have any Agent context data yet.
						</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<>
			<Card className="h-full">
				<CardHeader>
					<CardTitle className="flex items-center justify-between text-base">
						<div className="flex items-center gap-2">
							<DatabaseIcon className="h-4 w-4 text-primary" />
							Agent context
						</div>
						<div className="flex items-center gap-1">
							<Button
								variant="ghost"
								size="sm"
								onClick={handleEdit}
								className="h-7 px-2 text-xs"
							>
								<EditIcon className="mr-1 h-3 w-3" />
								Edit
							</Button>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => fetchState(false)}
								disabled={isRefetching}
								className="h-7 w-7 p-0"
							>
								<RefreshCwIcon
									className={`h-3.5 w-3.5 ${isRefetching ? "animate-spin" : ""}`}
								/>
							</Button>
						</div>
					</CardTitle>
				</CardHeader>
				<CardContent className="min-h-0 flex-1 p-0">
					<Tabs defaultValue="pretty" className="flex h-full flex-col">
						<div className="px-4 pt-2 pb-1">
							<TabsList className="grid h-8 w-full grid-cols-2">
								<TabsTrigger value="pretty" className="text-xs">
									Pretty
								</TabsTrigger>
								<TabsTrigger value="raw" className="text-xs">
									RAW
								</TabsTrigger>
							</TabsList>
						</div>

						<TabsContent value="pretty" className="mt-0 min-h-0 flex-1">
							<ScrollArea className="h-full px-4 pb-4">
								<div className="space-y-3">
									<div className="space-y-2">
										<h4 className="font-medium text-foreground text-xs">
											Thread Events ({state.thread.events.length})
										</h4>
										<div className="space-y-2">
											{state.thread.events.map((event, index) => (
												<div
													key={index}
													className="rounded-md border bg-card p-2"
												>
													<div className="mb-2 flex items-center gap-2">
														<Badge
															variant="outline"
															className="px-1.5 py-0.5 text-xs"
														>
															{event.type}
														</Badge>
													</div>
													<pre className="max-w-full overflow-x-auto whitespace-pre-wrap break-words rounded bg-muted p-2 text-xs leading-relaxed">
														{JSON.stringify(event.data, null, 2)}
													</pre>
												</div>
											))}
										</div>
									</div>

									{/* Initial Email */}
									{state.thread.initial_email && (
										<div className="space-y-2">
											<h4 className="font-medium text-foreground text-xs">
												Initial Email
											</h4>
											<div className="rounded-md border bg-card p-2">
												<pre className="max-w-full overflow-x-auto whitespace-pre-wrap break-words rounded bg-muted p-2 text-xs leading-relaxed">
													{JSON.stringify(state.thread.initial_email, null, 2)}
												</pre>
											</div>
										</div>
									)}
								</div>
							</ScrollArea>
						</TabsContent>

						<TabsContent value="raw" className="mt-0 min-h-0 flex-1">
							<ScrollArea className="h-full px-4 pb-4">
								<div className="space-y-2">
									<h4 className="font-medium text-foreground text-xs">
										Raw State Data
									</h4>
									<div className="rounded-md border bg-card p-2">
										<pre className="max-w-full overflow-x-auto whitespace-pre-wrap break-words rounded bg-muted p-2 text-xs leading-relaxed">
											{JSON.stringify(state, null, 2)}
										</pre>
									</div>
								</div>
							</ScrollArea>
						</TabsContent>
					</Tabs>
				</CardContent>
			</Card>

			{/* Edit Modal */}
			{state && (
				<RedisStateModal
					isOpen={isModalOpen}
					onClose={handleModalClose}
					onSaveSuccess={handleSaveSuccess}
					state={state}
					stateId={stateId}
					mode="json"
				/>
			)}
		</>
	);
}
