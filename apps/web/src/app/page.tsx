"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
	PromptInput,
	PromptInputBody,
	PromptInputSubmit,
	PromptInputTextarea,
	PromptInputToolbar,
} from "@/components/ai-elements/prompt-input";
import { Button } from "@/components/ui/button";

function AppPromptInput() {
	const router = useRouter();
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async (
		message: { text?: string; files?: any[] },
		_event: React.FormEvent,
	) => {
		if (!message.text?.trim()) return;

		setIsSubmitting(true);
		try {
			sessionStorage.setItem("pendingMessage", message.text);
			router.push("/dashboard");
		} catch (error) {
			console.error("Error storing message:", error);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<PromptInput onSubmit={handleSubmit}>
			<PromptInputBody>
				<PromptInputTextarea
					placeholder="Describe the mobile app you want to build..."
					className="border-white/20 bg-white/10 text-white placeholder:text-white/60"
				/>
			</PromptInputBody>
			<PromptInputToolbar>
				<PromptInputSubmit
					status={isSubmitting ? "submitted" : undefined}
					disabled={isSubmitting}
				/>
			</PromptInputToolbar>
		</PromptInput>
	);
}

export default function Home() {
	const router = useRouter();

	return (
		<div className="min-h-screen bg-background">
			<div className="flex items-center justify-between p-6">
				<div className="flex items-center gap-2">
					<div className="h-2 w-2 rounded-full bg-white" />
					<span className="font-semibold text-lg text-white">HITL</span>
				</div>
				<Button
					variant="outline"
					onClick={() => router.push("/dashboard")}
					className="border-white/20 bg-transparent text-white hover:bg-white/10"
				>
					Dashboard
				</Button>
			</div>

			<div className="flex flex-col items-center justify-center px-6 py-20">
				<div className="w-full max-w-2xl space-y-8 text-center">
					<div className="space-y-4">
						<h1 className="font-bold text-4xl text-white">
							Build native mobile apps, fast.
						</h1>
						<p className="text-lg text-white/80">
							HITL builds complete, cross-platform mobile apps using AI and
							React Native.
						</p>
					</div>

					<div className="w-full">
						<AppPromptInput />
					</div>
				</div>
			</div>

			<div className="-translate-x-1/2 absolute bottom-6 left-1/2 transform text-sm text-white/60">
				Published with HITL
			</div>
		</div>
	);
}
