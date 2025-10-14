import { Skeleton } from "@/components/ui/skeleton";

export function RedisStatePanelSkeleton() {
	return (
		<div className="h-full rounded-lg border bg-card">
			<div className="border-b p-4">
				<Skeleton className="h-5 w-32" />
			</div>
			<div className="space-y-6 p-4">
				{/* Thread Events header */}
				<div className="space-y-3">
					<Skeleton className="h-4 w-40" />
					<div className="space-y-3">
						{Array.from({ length: 3 }).map((_, i) => (
							<div key={i} className="rounded-lg border bg-card p-3">
								<div className="mb-3 flex items-center gap-2">
									<Skeleton className="h-4 w-16" />
								</div>
								<Skeleton className="h-20 w-full" />
							</div>
						))}
					</div>
				</div>
				<div className="space-y-3">
					<Skeleton className="h-4 w-28" />
					<Skeleton className="h-24 w-full" />
				</div>
			</div>
		</div>
	);
}


