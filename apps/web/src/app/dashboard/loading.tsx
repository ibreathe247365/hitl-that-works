import { ThreadGridSkeleton } from "@/components/skeletons/thread-list";
import { SidebarSkeleton } from "@/components/skeletons/sidebar";

export default function Loading() {
	return (
		<div className="flex h-screen">
			<main className="ml-16 flex-1 overflow-y-auto">
				<div className="container mx-auto px-6">
					<div className="sticky top-0 z-10 bg-background/95 py-8 backdrop-blur supports-[backdrop-filter]:bg-background/60">
						<div className="h-8 w-48 rounded-md bg-muted" />
						<div className="mt-2 h-5 w-32 rounded-md bg-muted" />
					</div>
					<ThreadGridSkeleton count={5} />
				</div>
			</main>
		</div>
	);
}


