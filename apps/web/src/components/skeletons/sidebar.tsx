import { Skeleton } from "@/components/ui/skeleton";

export function SidebarSkeleton() {
	return (
		<aside className="w-16 shrink-0 border-r p-2">
			<div className="flex h-full flex-col items-center gap-3">
				<Skeleton className="mt-1 h-10 w-10 rounded-md" />
				<Skeleton className="h-8 w-8 rounded-md" />
				<Skeleton className="h-8 w-8 rounded-md" />
				<Skeleton className="h-8 w-8 rounded-md" />
				<div className="mt-auto flex flex-col items-center gap-3 pb-2">
					<Skeleton className="h-8 w-8 rounded-md" />
					<Skeleton className="h-8 w-8 rounded-md" />
				</div>
			</div>
		</aside>
	);
}


