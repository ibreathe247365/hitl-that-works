"use client";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function BackgroundGradientOverlay({
	firstColor = "18, 113, 255",
	secondColor = "221, 74, 255",
	thirdColor = "100, 220, 255",
	fourthColor = "200, 50, 50",
	fifthColor = "180, 180, 50",
	size = "80%",
	blendingValue = "hard-light",
	circlesOpacity = 1,
	className,
}: {
	firstColor?: string;
	secondColor?: string;
	thirdColor?: string;
	fourthColor?: string;
	fifthColor?: string;
	size?: string;
	blendingValue?: string;
	circlesOpacity?: number;
	className?: string;
}) {
	useEffect(() => {
		document.body.style.setProperty("--first-color", firstColor);
		document.body.style.setProperty("--second-color", secondColor);
		document.body.style.setProperty("--third-color", thirdColor);
		document.body.style.setProperty("--fourth-color", fourthColor);
		document.body.style.setProperty("--fifth-color", fifthColor);
		document.body.style.setProperty("--size", size);
		document.body.style.setProperty("--blending-value", blendingValue);
	}, []);

	const [isSafari, setIsSafari] = useState(false);
	useEffect(() => {
		setIsSafari(/^((?!chrome|android).)*safari/i.test(navigator.userAgent));
	}, []);

	return (
		<div
			className={cn(
				"pointer-events-none fixed inset-0 z-50 overflow-hidden",
				className,
			)}
		>
			<svg className="hidden">
				<defs>
					<filter id="blurMe">
						<feGaussianBlur
							in="SourceGraphic"
							stdDeviation="10"
							result="blur"
						/>
						<feColorMatrix
							in="blur"
							mode="matrix"
							values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8"
							result="goo"
						/>
						<feBlend in="SourceGraphic" in2="goo" />
					</filter>
				</defs>
			</svg>
			<div
				className={cn(
					"gradients-container h-full w-full blur-lg",
					isSafari ? "blur-2xl" : "[filter:url(#blurMe)_blur(40px)]",
				)}
			>
				<div
					className={cn(
						"absolute [background:radial-gradient(circle_at_center,_var(--first-color)_0,_var(--first-color)_50%)_no-repeat]",
						"top-[calc(20%-var(--size)/2)] left-[calc(50%-var(--size)/2)] h-[var(--size)] w-[var(--size)] [mix-blend-mode:var(--blending-value)]",
						"[transform-origin:center_center]",
						"animate-first",
					)}
					style={{ opacity: circlesOpacity }}
				/>
				<div
					className={cn(
						"absolute [background:radial-gradient(circle_at_center,_rgba(var(--second-color),_0.8)_0,_rgba(var(--second-color),_0)_50%)_no-repeat]",
						"top-[calc(20%-var(--size)/2)] left-[calc(50%-var(--size)/2)] h-[var(--size)] w-[var(--size)] [mix-blend-mode:var(--blending-value)]",
						"[transform-origin:calc(50%-400px)]",
						"animate-second",
					)}
					style={{ opacity: circlesOpacity }}
				/>
				<div
					className={cn(
						"absolute [background:radial-gradient(circle_at_center,_rgba(var(--third-color),_0.8)_0,_rgba(var(--third-color),_0)_50%)_no-repeat]",
						"top-[calc(20%-var(--size)/2)] left-[calc(50%-var(--size)/2)] h-[var(--size)] w-[var(--size)] [mix-blend-mode:var(--blending-value)]",
						"[transform-origin:calc(50%+400px)]",
						"animate-third",
					)}
					style={{ opacity: circlesOpacity }}
				/>
				<div
					className={cn(
						"absolute [background:radial-gradient(circle_at_center,_rgba(var(--fourth-color),_0.8)_0,_rgba(var(--fourth-color),_0)_50%)_no-repeat]",
						"top-[calc(20%-var(--size)/2)] left-[calc(50%-var(--size)/2)] h-[var(--size)] w-[var(--size)] [mix-blend-mode:var(--blending-value)]",
						"[transform-origin:calc(50%-200px)]",
						"animate-fourth",
					)}
					style={{ opacity: circlesOpacity * 0.7 }}
				/>
				<div
					className={cn(
						"absolute [background:radial-gradient(circle_at_center,_rgba(var(--fifth-color),_0.8)_0,_rgba(var(--fifth-color),_0)_50%)_no-repeat]",
						"top-[calc(20%-var(--size)/2)] left-[calc(50%-var(--size)/2)] h-[var(--size)] w-[var(--size)] [mix-blend-mode:var(--blending-value)]",
						"[transform-origin:calc(50%-800px)_calc(50%+800px)]",
						"animate-fifth",
					)}
					style={{ opacity: circlesOpacity }}
				/>
			</div>
		</div>
	);
}

export default BackgroundGradientOverlay;
