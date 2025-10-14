'use client';

import { useRouter } from "next/navigation";

export default function Error({
	error,
	reset,
}: {
	error: Error;
	reset: () => void;
}) {
	const router = useRouter();

	return (
		<div className="flex h-screen items-center justify-center p-6">
			<div className="space-y-4 text-center">
				<p className="text-muted-foreground">
					Something went wrong loading this thread.
				</p>
				<div className="flex items-center justify-center gap-2">
					<button
						className="inline-flex h-9 items-center justify-center rounded-md border px-4 text-sm font-medium shadow-sm hover:bg-accent"
						onClick={() => reset()}
					>
						Try again
					</button>
					<button
						className="inline-flex h-9 items-center justify-center rounded-md border px-4 text-sm font-medium shadow-sm hover:bg-accent"
						onClick={() => router.push('/dashboard')}
					>
						Back to dashboard
					</button>
				</div>
				<pre className="mx-auto max-w-lg overflow-auto rounded-md bg-muted p-3 text-left text-xs text-muted-foreground">
					{error?.message}
				</pre>
			</div>
		</div>
	);
}


