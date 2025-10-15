"use client";

import type { Thread, Event } from "@hitl/ai";
import { PlusIcon, TrashIcon } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

// Utility function to safely stringify JSON with proper encoding
const safeStringify = (obj: any): string => {
	try {
		return JSON.stringify(obj, null, 2);
	} catch (_error) {
		return "{}";
	}
};

// Utility function to safely parse JSON
const safeParse = (str: string): any => {
	try {
		const trimmed = str.trim();
		return trimmed ? JSON.parse(trimmed) : null;
	} catch (_error) {
		return null;
	}
};

interface RedisStateEditorProps {
	thread: Thread;
	onThreadChange: (thread: Thread) => void;
}

const EVENT_TYPES = [
	"human_response",
	"request_more_information", 
	"user_message",
	"ai_response",
	"assistant_message",
	"tool_call",
	"function_call",
	"webhook_processed",
	"rollback-agent",
	"generic",
] as const;

export function RedisStateEditor({ thread, onThreadChange }: RedisStateEditorProps) {
	const [editingEventIndex, setEditingEventIndex] = useState<number | null>(null);
	const [initialEmailInput, setInitialEmailInput] = useState<string>(
		thread.initial_email ? safeStringify(thread.initial_email) : ""
	);
	const [eventDataInputs, setEventDataInputs] = useState<Record<number, string>>({});

	// Track if user is actively editing to prevent resets during refetch
	const isEditingRef = useRef(false);
	const lastThreadRef = useRef(thread);

	// Sync local state when thread prop changes, but preserve user input during editing
	useEffect(() => {
		// If user is actively editing, don't reset their input
		if (isEditingRef.current) {
			return;
		}

		// Only update if the thread actually changed (not just a refetch of same data)
		const currentThreadString = JSON.stringify(thread);
		const lastThreadString = JSON.stringify(lastThreadRef.current);
		
		if (currentThreadString !== lastThreadString) {
			setInitialEmailInput(thread.initial_email ? safeStringify(thread.initial_email) : "");
			
			// Initialize event data inputs
			const inputs: Record<number, string> = {};
			thread.events.forEach((event, index) => {
				inputs[index] = safeStringify(event.data);
			});
			setEventDataInputs(inputs);
			
			lastThreadRef.current = thread;
		}
	}, [thread]);

	const addEvent = () => {
		const newEvent: Event = {
			type: "generic",
			data: {},
		};
		const updatedThread = {
			...thread,
			events: [...thread.events, newEvent],
		};
		onThreadChange(updatedThread);
		setEditingEventIndex(thread.events.length);
	};

	const removeEvent = (index: number) => {
		const updatedThread = {
			...thread,
			events: thread.events.filter((_, i) => i !== index),
		};
		onThreadChange(updatedThread);
		if (editingEventIndex === index) {
			setEditingEventIndex(null);
		} else if (editingEventIndex !== null && editingEventIndex > index) {
			setEditingEventIndex(editingEventIndex - 1);
		}
	};

	const updateEvent = (index: number, updatedEvent: Event) => {
		const updatedThread = {
			...thread,
			events: thread.events.map((event, i) => (i === index ? updatedEvent : event)),
		};
		onThreadChange(updatedThread);
	};

	const updateInitialEmail = (value: string) => {
		isEditingRef.current = true;
		setInitialEmailInput(value);
		const parsed = safeParse(value);
		if (parsed !== null) {
			onThreadChange({
				...thread,
				initial_email: parsed,
			});
		}
		
		// Reset editing flag after a short delay
		setTimeout(() => {
			isEditingRef.current = false;
		}, 1000);
	};

	return (
		<div className="space-y-4">
			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="text-sm">Initial Email</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-2">
						<Label htmlFor="initial-email">Initial Email Data</Label>
						<Textarea
							id="initial-email"
							value={initialEmailInput}
							onChange={(e) => updateInitialEmail(e.target.value)}
							placeholder="Enter initial email data as JSON..."
							className="min-h-20 font-mono text-xs"
						/>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="pb-3">
					<div className="flex items-center justify-between">
						<CardTitle className="text-sm">Events ({thread.events.length})</CardTitle>
						<Button onClick={addEvent} size="sm" className="h-7 px-2 text-xs">
							<PlusIcon className="mr-1 h-3 w-3" />
							Add Event
						</Button>
					</div>
				</CardHeader>
				<CardContent>
					<ScrollArea className="max-h-96">
						<div className="space-y-3">
							{thread.events.map((event, index) => (
								<div key={index} className="rounded-md border bg-card p-3">
									<div className="flex items-center justify-between mb-2">
										<div className="flex items-center gap-2">
											<Badge variant="outline" className="px-1.5 py-0.5 text-xs">
												{event.type}
											</Badge>
											<span className="text-muted-foreground text-xs">#{index}</span>
										</div>
										<div className="flex items-center gap-1">
											<Button
												variant="ghost"
												size="sm"
												onClick={() => setEditingEventIndex(editingEventIndex === index ? null : index)}
												className="h-6 px-2 text-xs"
											>
												{editingEventIndex === index ? "Done" : "Edit"}
											</Button>
											<Button
												variant="ghost"
												size="sm"
												onClick={() => removeEvent(index)}
												className="h-6 w-6 p-0 text-destructive hover:text-destructive"
											>
												<TrashIcon className="h-3 w-3" />
											</Button>
										</div>
									</div>

									{editingEventIndex === index ? (
										<div className="space-y-3">
											<div className="space-y-2">
												<Label htmlFor={`event-type-${index}`}>Event Type</Label>
												<Select
													value={event.type}
													onValueChange={(value) =>
														updateEvent(index, { ...event, type: value as any })
													}
												>
													<SelectTrigger id={`event-type-${index}`}>
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														{EVENT_TYPES.map((type) => (
															<SelectItem key={type} value={type}>
																{type}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</div>

											<div className="space-y-2">
												<Label htmlFor={`event-data-${index}`}>Event Data</Label>
												<Textarea
													id={`event-data-${index}`}
													value={eventDataInputs[index] || safeStringify(event.data)}
													onChange={(e) => {
														const value = e.target.value;
														isEditingRef.current = true;
														setEventDataInputs(prev => ({ ...prev, [index]: value }));
														const parsed = safeParse(value);
														if (parsed !== null) {
															updateEvent(index, { ...event, data: parsed });
														}
														
														// Reset editing flag after a short delay
														setTimeout(() => {
															isEditingRef.current = false;
														}, 1000);
													}}
													placeholder="Enter event data as JSON..."
													className="min-h-20 font-mono text-xs"
												/>
											</div>
										</div>
									) : (
										<pre className="max-w-full overflow-x-auto whitespace-pre-wrap break-words rounded bg-muted p-2 text-xs leading-relaxed">
											{safeStringify(event.data)}
										</pre>
									)}
								</div>
							))}

							{thread.events.length === 0 && (
								<div className="py-8 text-center text-muted-foreground text-sm">
									No events yet. Click "Add Event" to create one.
								</div>
							)}
						</div>
					</ScrollArea>
				</CardContent>
			</Card>
		</div>
	);
}
