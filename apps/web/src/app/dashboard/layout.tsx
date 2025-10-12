"use client";

import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/sidebar";
import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const [showSignIn, setShowSignIn] = useState(false);
	const router = useRouter();

	// Handle pending message after authentication
	useEffect(() => {
		const handlePendingMessage = async () => {
			const pendingMessage = sessionStorage.getItem("pendingMessage");
			if (pendingMessage) {
				try {
					const response = await fetch("/api/thread/send-message", {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify({
							message: pendingMessage,
						}),
					});

					if (response.ok) {
						const result = await response.json();
						// Clear the pending message
						sessionStorage.removeItem("pendingMessage");
						// Redirect to the new thread
						router.push(`/dashboard/threads/${result.stateId}`);
					}
				} catch (error) {
					console.error("Error sending pending message:", error);
					// Clear the pending message even if there's an error
					sessionStorage.removeItem("pendingMessage");
				}
			}
		};

		// Only run this effect when the component mounts and user is authenticated
		handlePendingMessage();
	}, [router]);

	return (
		<>
			<Authenticated>
				<div className="flex h-screen">
					<Sidebar />
					<main className="ml-16 flex-1 overflow-hidden">{children}</main>
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
			<AuthLoading>
				<div className="flex h-screen items-center justify-center">
					<div>Loading...</div>
				</div>
			</AuthLoading>
		</>
	);
}
