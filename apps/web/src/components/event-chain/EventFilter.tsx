"use client";

import { FilterIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import type { EventType, EventTypeFilter } from "./types";

interface EventFilterProps {
	visibleEventTypes: EventTypeFilter;
	onFilterChange: (filters: EventTypeFilter) => void;
}

// Define event type categories using the actual event types
const EVENT_TYPE_CATEGORIES: Record<string, EventType[]> = {
	"User Actions": ["thread_created", "human_response", "user_message"],
	"AI Actions": ["ai_response", "assistant_message", "ai_step"],
	GitHub: [
		"search_github",
		"update_github_issue",
		"comment_on_issue",
		"link_issues",
		"github_search_result",
		"function_result",
	],
	"Tools/Functions": [
		"tool_call",
		"function_call",
		"calculate",
		"calculate_result",
	],
	Webhooks: ["webhook_received", "webhook", "webhook_processed"],
	System: [
		"queue",
		"error",
		"request_more_information",
		"human_contact_sent",
		"done_for_now",
		"nothing_to_do",
	],
} as const;

export const ALL_EVENT_TYPES: EventType[] = Object.values(
	EVENT_TYPE_CATEGORIES,
).flat();

export function EventFilter({
	visibleEventTypes,
	onFilterChange,
}: EventFilterProps) {
	const [isOpen, setIsOpen] = useState(false);

	const handleEventTypeToggle = (eventType: EventType) => {
		onFilterChange({
			...visibleEventTypes,
			[eventType]: !visibleEventTypes[eventType],
		});
	};

	const handleSelectAll = () => {
		const allSelected = ALL_EVENT_TYPES.reduce((acc, eventType) => {
			acc[eventType] = true;
			return acc;
		}, {} as EventTypeFilter);
		onFilterChange(allSelected);
	};

	const handleDeselectAll = () => {
		const noneSelected = ALL_EVENT_TYPES.reduce((acc, eventType) => {
			acc[eventType] = false;
			return acc;
		}, {} as EventTypeFilter);
		onFilterChange(noneSelected);
	};

	const selectedCount = Object.values(visibleEventTypes).filter(Boolean).length;
	const totalCount = ALL_EVENT_TYPES.length;

	return (
		<Popover open={isOpen} onOpenChange={setIsOpen}>
			<PopoverTrigger asChild>
				<Button variant="outline" size="sm" className="gap-2">
					<FilterIcon className="h-4 w-4" />
					Filters
					{selectedCount < totalCount && (
						<span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-primary-foreground text-xs">
							{selectedCount}/{totalCount}
						</span>
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-80" align="end">
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<h4 className="font-medium">Filter Event Types</h4>
						<div className="flex gap-2">
							<Button
								variant="ghost"
								size="sm"
								onClick={handleSelectAll}
								className="h-8 px-2 text-xs"
							>
								All
							</Button>
							<Button
								variant="ghost"
								size="sm"
								onClick={handleDeselectAll}
								className="h-8 px-2 text-xs"
							>
								None
							</Button>
						</div>
					</div>

					<div className="space-y-3">
						{Object.entries(EVENT_TYPE_CATEGORIES).map(
							([category, eventTypes]) => (
								<div key={category} className="space-y-2">
									<h5 className="font-medium text-muted-foreground text-sm">
										{category}
									</h5>
									<div className="space-y-1.5 pl-2">
										{eventTypes.map((eventType) => (
											<div
												key={eventType}
												className="flex items-center space-x-2"
											>
												<Checkbox
													id={eventType}
													checked={visibleEventTypes[eventType] ?? true}
													onCheckedChange={() =>
														handleEventTypeToggle(eventType)
													}
												/>
												<label
													htmlFor={eventType}
													className="font-medium text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
												>
													{eventType.replace(/_/g, " ")}
												</label>
											</div>
										))}
									</div>
									<Separator className="my-2" />
								</div>
							),
						)}
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
}
