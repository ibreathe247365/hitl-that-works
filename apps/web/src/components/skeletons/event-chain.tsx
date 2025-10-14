import { Skeleton } from "@/components/ui/skeleton";

interface EventChainSkeletonProps {
	count?: number;
}

export function EventItemSkeleton() {
	return (
		<div className="rounded-lg border p-4">
			<div className="mb-3 flex items-center gap-2">
				<Skeleton className="h-5 w-24" />
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

export function EventChainSkeleton({ count = 5 }: EventChainSkeletonProps) {
	return (
		<div className="h-full rounded-lg border bg-card">
			<div className="border-b p-4">
				<div className="flex items-center gap-2">
					<Skeleton className="h-5 w-28" />
				</div>
			</div>
			<div className="space-y-4 p-4">
				{Array.from({ length: count }).map((_, index) => (
					<EventItemSkeleton key={index} />
				))}
			</div>
		</div>
	);
}
