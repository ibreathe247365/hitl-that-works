import { Skeleton } from "@/components/ui/skeleton";

interface ThreadGridSkeletonProps {
	count?: number;
}

export function ThreadCardSkeleton() {
	return (
		<div className="group cursor-default rounded-xl border bg-card p-4 shadow-sm">
			<div className="mb-3 flex items-center justify-between">
				<Skeleton className="h-5 w-32" />
				<Skeleton className="h-5 w-16" />
			</div>
			<div className="space-y-2">
				<Skeleton className="h-4 w-full" />
				<Skeleton className="h-4 w-5/6" />
				<Skeleton className="h-4 w-2/3" />
			</div>
		</div>
	);
}

export function ThreadGridSkeleton({ count = 12 }: ThreadGridSkeletonProps) {
	return (
		<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			{Array.from({ length: count }).map((_, index) => (
				<ThreadCardSkeleton key={index} />
			))}
		</div>
	);
}
