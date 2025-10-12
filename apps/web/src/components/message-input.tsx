"use client";

import { api } from "@hitl/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { useState } from "react";
import {
	PromptInput,
	PromptInputBody,
	PromptInputSubmit,
	PromptInputTextarea,
	PromptInputToolbar,
} from "@/components/ai-elements/prompt-input";

interface MessageInputProps {
	stateId?: string;
	onMessageSent?: (stateId: string) => void;
}

export function MessageInput({ stateId, onMessageSent }: MessageInputProps) {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const user = useQuery(api.auth.getCurrentUser);

	const handleSubmit = async (
		message: { text?: string; files?: any[] },
		_event: React.FormEvent,
	) => {
		if (!message.text?.trim() || !user) return;

		setIsSubmitting(true);
		try {
			const response = await fetch("/api/thread/send-message", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					stateId,
					message: message.text,
					email: user.email, // Provide email for authenticated users
				}),
			});

			if (!response.ok) {
				console.log(response);
				throw new Error("Failed to send message");
			}

			const result = await response.json();
			onMessageSent?.(result.stateId);
		} catch (error) {
			console.error("Error sending message:", error);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="px-6 py-4">
			<div className="mx-auto max-w-4xl">
				<div className="mb-3 flex items-center gap-2">
					<div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
					<span className="text-muted-foreground text-sm font-medium">Ready to chat</span>
				</div>
				<PromptInput onSubmit={handleSubmit}>
					<PromptInputBody>
						<PromptInputTextarea 
							placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)" 
							className="min-h-[60px] resize-none border-0 bg-transparent focus:ring-0 focus:outline-none text-base"
						/>
					</PromptInputBody>
					<PromptInputToolbar>
						<PromptInputSubmit
							status={isSubmitting ? "submitted" : undefined}
							disabled={isSubmitting}
							className="h-8 w-8"
						/>
					</PromptInputToolbar>
				</PromptInput>
			</div>
		</div>
	);
}
