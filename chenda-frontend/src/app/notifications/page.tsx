"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function NotificationsPage() {
	const router = useRouter();

	return (
		<main className="mx-auto w-full max-w-3xl p-6">
			<div className="mb-6">
				<Button 
					variant="ghost" 
					size="sm" 
					onClick={() => router.back()}
					className="-ml-3 mb-4 text-muted-foreground hover:text-foreground"
				>
					<ArrowLeft className="mr-2 h-4 w-4" />
					Back
				</Button>
				<h1 className="text-2xl font-semibold">Notifications</h1>
			</div>
			<p className="mt-2 text-sm text-muted-foreground">
				Notification center is coming soon.
			</p>
		</main>
	);
}
