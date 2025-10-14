"use client";

import { Authenticated, Unauthenticated } from "convex/react";
import { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";
import { BackgroundGradientAnimation } from "@/components/ui/background-gradient-animation";

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const [showSignIn, setShowSignIn] = useState(false);

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
			interactive={false}
			containerClassName="fixed inset-0 z-[-1]"
			circlesOpacity={0.1}
		>
			<Authenticated>
				<div className="flex h-screen">
					<Sidebar />
					<main className="ml-16 flex-1 overflow-y-auto">{children}</main>
				</div>
			</Authenticated>
			<Unauthenticated>
				<div className="flex h-screen items-center justify-center">
					{showSignIn ? (
						<SignInForm onSwitchToSignUp={() => setShowSignIn(false)} />
					) : (
						<SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} />
					)}
				</div>
			</Unauthenticated>
		</BackgroundGradientAnimation>
	);
}
