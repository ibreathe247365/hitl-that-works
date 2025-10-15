"use client";

import type { Thread, ThreadStateWithMetadata } from "@hitl/ai";
import { SaveIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { RedisStateEditor } from "./redis-state-editor";

interface RedisStateModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSaveSuccess: () => void;
	state: ThreadStateWithMetadata;
	stateId: string;
	mode: "json" | "form";
}

export function RedisStateModal({
	isOpen,
	onClose,
	onSaveSuccess,
	state,
	stateId,
	mode,
}: RedisStateModalProps) {
	const [editedState, setEditedState] = useState<string>(
		JSON.stringify(state, null, 2),
	);
	const [isSaving, setIsSaving] = useState(false);
	const [currentMode, setCurrentMode] = useState<"json" | "form">(mode);

	if (!isOpen) return null;

	const handleFormChange = (updatedThread: Thread) => {
		const updatedState = {
			...state,
			thread: updatedThread,
		};
		setEditedState(JSON.stringify(updatedState, null, 2));
	};

	const handleSave = async () => {
		setIsSaving(true);
		try {
			// Parse the edited state (basic JSON validation)
			const parsedState = JSON.parse(editedState) as ThreadStateWithMetadata;

			// Basic validation - ensure it has the required structure
			if (!parsedState.thread || !Array.isArray(parsedState.thread.events)) {
				throw new Error("Invalid state format: missing thread or events array");
			}

			// Call the API endpoint to update the state and queue webhook
			const response = await fetch(`/api/redis/${stateId}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ thread: parsedState.thread }),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to update state");
			}

			const result = await response.json();
			toast.success("State updated successfully");
			onSaveSuccess();
		} catch (error) {
			toast.error(
				"Failed to save state: " +
					(error instanceof Error ? error.message : "Unknown error"),
			);
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
			<Card className="flex h-[90vh] w-full max-w-6xl flex-col">
				<CardHeader className="flex flex-shrink-0 flex-row items-center justify-between space-y-0 pb-4">
					<CardTitle className="font-semibold text-lg">
						Edit Agent State
					</CardTitle>
					<Button
						variant="ghost"
						size="sm"
						onClick={onClose}
						className="h-8 w-8 p-0"
					>
						<XIcon className="h-4 w-4" />
					</Button>
				</CardHeader>
				<CardContent className="flex min-h-0 flex-1 flex-col p-6 pt-0">
					<Tabs
						value={currentMode}
						onValueChange={(value) => setCurrentMode(value as "json" | "form")}
						className="flex min-h-0 flex-1 flex-col"
					>
						<TabsList className="grid w-full flex-shrink-0 grid-cols-2">
							<TabsTrigger value="json">JSON Editor</TabsTrigger>
							<TabsTrigger value="form">Form Editor</TabsTrigger>
						</TabsList>

						<TabsContent
							value="json"
							className="mt-4 flex min-h-0 flex-1 flex-col"
						>
							<div className="flex min-h-0 flex-1 flex-col space-y-2">
								<label className="flex-shrink-0 font-medium text-sm">
									State Data (JSON)
								</label>
								<div className="min-h-0 flex-1">
									<ScrollArea className="h-full">
										<Textarea
											value={editedState}
											onChange={(e) => setEditedState(e.target.value)}
											className="min-h-full resize-none border-0 font-mono text-sm focus-visible:ring-0"
											placeholder="Edit the JSON state data..."
										/>
									</ScrollArea>
								</div>
								<p className="flex-shrink-0 text-muted-foreground text-xs">
									⚠️ Warning: Editing the state will trigger AI re-evaluation.
									Make sure the JSON is valid.
								</p>
							</div>
						</TabsContent>

						<TabsContent
							value="form"
							className="mt-4 flex min-h-0 flex-1 flex-col"
						>
							<div className="flex min-h-0 flex-1 flex-col space-y-2">
								<label className="flex-shrink-0 font-medium text-sm">
									State Data (Form)
								</label>
								<div className="min-h-0 flex-1">
									<ScrollArea className="h-full">
										<RedisStateEditor
											thread={state.thread}
											onThreadChange={handleFormChange}
										/>
									</ScrollArea>
								</div>
								<p className="flex-shrink-0 text-muted-foreground text-xs">
									⚠️ Warning: Editing the state will trigger AI re-evaluation.
								</p>
							</div>
						</TabsContent>
					</Tabs>

					<div className="flex flex-shrink-0 justify-end space-x-2 border-t pt-4">
						<Button variant="outline" onClick={onClose} disabled={isSaving}>
							Cancel
						</Button>
						<Button onClick={handleSave} disabled={isSaving}>
							<SaveIcon
								className={`mr-2 h-4 w-4 ${isSaving ? "animate-spin" : ""}`}
							/>
							{isSaving ? "Saving..." : "Save Changes"}
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
