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
import { Logo } from "@/components/logo";
import { BackgroundGradientAnimation } from "@/components/ui/background-gradient-animation";
import { LayoutDashboard } from "lucide-react";

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
					placeholder="What do we automate today..."
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
		<BackgroundGradientAnimation
			firstColor="59, 130, 246"
			secondColor="147, 51, 234"
			thirdColor="236, 72, 153"
			fourthColor="34, 197, 94"
			fifthColor="251, 191, 36"
			pointerColor="99, 102, 241"
			size="60%"
			blendingValue="multiply"
			interactive={true}
			containerClassName="min-h-screen"
		>
			<div className="relative z-10 min-h-screen bg-background/10 backdrop-blur-sm">
				<div className="flex items-center justify-between p-6">
					<Logo white />
					<Button
						variant="outline"
						onClick={() => router.push("/dashboard")}
						className="border-white/20 bg-transparent text-white hover:bg-white/10"
					>
						<LayoutDashboard className="h-5 w-5" />
						Go to Dashboard
					</Button>
				</div>

				<div className="flex flex-col items-center justify-center px-6 py-20">
					<div className="w-full max-w-2xl space-y-8 text-center">
						<div className="space-y-4">
							<h1 className="font-bold text-4xl text-white drop-shadow-lg">
								HITL = Humans + AI
							</h1>
							<p className="text-lg text-white/90 drop-shadow-md">
								Intelligent AI agents that know when to pause and collaborate with humans.
							</p>
						</div>

						<div className="w-full">
							<AppPromptInput />
						</div>
					</div>
				</div>

				<div className="-translate-x-1/2 absolute bottom-6 left-1/2 transform text-sm text-white/70 drop-shadow-sm">
					made with {`<3`} by samir
				</div>
			</div>
		</BackgroundGradientAnimation>
	);
}


