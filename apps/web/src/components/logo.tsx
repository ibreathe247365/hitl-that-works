"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type LogoProps = {
	className?: string;
	// When true, forces white coloring (used on home hero)
	white?: boolean;
	size?: "sm" | "md";
	blink?: boolean;
};

export function Logo({ className, white, size = "md", blink = false }: LogoProps) {
	const dotClass = white ? "bg-white" : "bg-foreground";
	const textClass = white ? "text-white" : "text-foreground";
	const dotSize = size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2";
	const textSize = size === "sm" ? "text-sm" : "text-lg";

	return (
		<div className={cn("flex items-center gap-2", className)}>
			<div className={cn("rounded-full", dotSize, dotClass, blink && "animate-pulse")} />
			<span className={cn("font-semibold", textSize, textClass)}>HITL</span>
		</div>
	);
}


