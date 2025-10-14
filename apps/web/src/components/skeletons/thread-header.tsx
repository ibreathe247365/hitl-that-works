import { Skeleton } from "@/components/ui/skeleton";

export function ThreadDetailHeaderSkeleton() {
	return (
		<div className="flex items-center gap-4 border-b bg-background/95 px-6 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="-ml-2">
				<Skeleton className="h-8 w-8 rounded" />
			</div>
			<div className="flex min-w-0 flex-1 items-center gap-4">
				<div className="flex min-w-0 items-center gap-3">
					<Skeleton className="h-6 w-56" />
					<Skeleton className="h-5 w-16" />
				</div>
				<div className="hidden h-5 w-px bg-border sm:block" />
				<Skeleton className="h-5 w-24" />
			</div>
		</div>
	);
}
