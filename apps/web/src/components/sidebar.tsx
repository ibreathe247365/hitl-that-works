"use client";

import { api } from "@hitl/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { ListIcon, PlusIcon, UserIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { authClient } from "@/lib/auth-client";
import { ModeToggle } from "./mode-toggle";

export function Sidebar() {
	const router = useRouter();
	const user = useQuery(api.auth.getCurrentUser);

	const handleCreateThread = () => {
		const stateId = `thread_${Date.now()}_${Math.random().toString(36).substring(7)}`;
		router.push(`/dashboard/threads/${stateId}`);
	};

	const handleViewThreads = () => {
		router.push("/dashboard");
	};

	return (
		<div className="fixed top-0 left-0 flex h-full w-16 flex-col items-center space-y-4 border-r bg-background py-4">
			{/* Create Thread Button */}
			<Button
				variant="ghost"
				size="icon"
				onClick={handleCreateThread}
				className="h-12 w-12"
				title="Create new thread"
			>
				<PlusIcon className="h-6 w-6" />
			</Button>

			{/* View Threads Button */}
			<Button
				variant="ghost"
				size="icon"
				onClick={handleViewThreads}
				className="h-12 w-12"
				title="View all threads"
			>
				<ListIcon className="h-6 w-6" />
			</Button>

			{/* Spacer */}
			<div className="flex-1" />

			{/* User Avatar with Popover */}
			<Popover>
				<PopoverTrigger asChild>
					<Button variant="ghost" size="icon" className="h-12 w-12">
						<Avatar className="h-8 w-8">
							<AvatarImage src={user?.image || undefined} />
							<AvatarFallback>
								<UserIcon className="h-4 w-4" />
							</AvatarFallback>
						</Avatar>
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-64 p-4" align="end">
					<div className="space-y-4">
						<div className="space-y-2">
							<h4 className="font-medium text-sm">Account</h4>
							<div className="text-muted-foreground text-sm">{user?.email}</div>
						</div>

						<div className="space-y-2">
							<h4 className="font-medium text-sm">Theme</h4>
							<ModeToggle />
						</div>

						<div className="border-t pt-2">
							<Button
								variant="outline"
								size="sm"
								className="w-full"
								onClick={() => {
									authClient.signOut({
										fetchOptions: {
											onSuccess: () => {
												router.push("/");
											},
										},
									});
								}}
							>
								Sign Out
							</Button>
						</div>
					</div>
				</PopoverContent>
			</Popover>
		</div>
	);
}
