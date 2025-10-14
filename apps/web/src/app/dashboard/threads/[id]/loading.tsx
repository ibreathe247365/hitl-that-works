import { EventChainSkeleton } from "@/components/skeletons/event-chain";
import { RedisStatePanelSkeleton } from "@/components/skeletons/redis-panel";
import { ThreadDetailHeaderSkeleton } from "@/components/skeletons/thread-header";

export default function Loading() {
	return (
		<div className="flex h-screen flex-col">
			<ThreadDetailHeaderSkeleton />
			<div className="flex flex-1 gap-4 p-4">
				<div className="hidden h-full min-w-0 flex-1 lg:block">
					<EventChainSkeleton />
				</div>
				<div className="h-full min-w-0 flex-1 lg:w-2/5">
					<RedisStatePanelSkeleton />
				</div>
			</div>
		</div>
	);
}
