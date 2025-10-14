'use client';

export default function Error({
	error,
	reset,
}: {
error: Error;
	reset: () => void;
}) {
	return (
		<div className="flex h-screen items-center justify-center">
			<div className="space-y-4 text-center">
				<p className="text-muted-foreground">
					Something went wrong loading the dashboard.
				</p>
				<button
					className="inline-flex h-9 items-center justify-center rounded-md border px-4 text-sm font-medium shadow-sm hover:bg-accent"
					onClick={() => reset()}
				>
					Try again
                    {JSON.stringify(error)}
				</button>
			</div>
		</div>
	);
}


