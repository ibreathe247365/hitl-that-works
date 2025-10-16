"use client";

import { GitForkIcon, LayoutDashboard } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
	PromptInput,
	PromptInputBody,
	PromptInputSubmit,
	PromptInputTextarea,
	PromptInputToolbar,
} from "@/components/ai-elements/prompt-input";
import { Logo } from "@/components/logo";
import { ModeToggle } from "@/components/mode-toggle";
import { BackgroundGradientAnimation } from "@/components/ui/background-gradient-animation";
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
		} catch (_error) {
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<PromptInput onSubmit={handleSubmit}>
			<PromptInputBody>
				<PromptInputTextarea
					placeholder="What do we automate today..."
					className="border-foreground/20 bg-background/10 text-foreground placeholder:text-foreground/60 dark:border-white/30 dark:text-white dark:placeholder:text-white/70"
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
			<div className="relative z-10 min-h-screen bg-background/5 backdrop-blur-sm dark:bg-background/20">
				<div className="flex items-center justify-between p-6">
					<Logo />
					<div className="flex items-center gap-4">
						<ModeToggle />
						<a
							href="https://github.com/ibreathe247365/hitl-that-works"
							target="_blank"
							rel="noopener noreferrer"
							aria-label="View project on GitHub"
							className="inline-flex items-center justify-center rounded-md border border-foreground/20 bg-background/10 px-2 py-2 text-foreground transition-colors hover:bg-background/20 dark:border-white/30 dark:bg-transparent dark:text-white dark:hover:bg-white/20"
						>
							<GitForkIcon className="h-4 w-4" />
						</a>
						<Button
							variant="outline"
							onClick={() => router.push("/dashboard")}
							className="border-foreground/20 bg-background/10 text-foreground hover:bg-background/20 dark:border-white/30 dark:bg-transparent dark:text-white dark:hover:bg-white/20"
						>
							<LayoutDashboard className="h-5 w-5" />
							Go to Dashboard
						</Button>
					</div>
				</div>

				<div className="flex flex-col items-center justify-center px-6 py-20">
					<div className="w-full max-w-2xl space-y-8 text-center">
						<div className="space-y-4">
							<h1 className="font-bold text-4xl text-foreground drop-shadow-lg dark:text-white">
								HITL = Humans + AI
							</h1>
							<p className="text-foreground/90 text-lg drop-shadow-md dark:text-white/95">
								Intelligent AI agents that know when to pause and collaborate
								with humans.
							</p>
						</div>

						<div className="w-full">
							<AppPromptInput />
						</div>
					</div>
				</div>

				<div className="-translate-x-1/2 absolute bottom-6 left-1/2 transform text-foreground/70 text-sm drop-shadow-sm dark:text-white/80">
					made with {"<3"} by samir
				</div>
			</div>
		</BackgroundGradientAnimation>
	);
}
