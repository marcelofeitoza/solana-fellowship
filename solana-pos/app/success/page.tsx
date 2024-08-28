"use client";
import { useRouter } from "next/navigation";

export default function Success() {
	const router = useRouter();

	return (
		<div className="flex flex-col items-center justify-center h-screen space-y-4 bg-[#0f0f0f]">
			<h1 className="text-2xl font-semibold">DeVolt Payment</h1>
			<h2 className="text-white">
				Go to charging stations number {Math.floor(Math.random() * 100)}{" "}
				and charge your car.
			</h2>
			<p className="text-white">
				Thank you for your payment. Your transaction is being processed.
			</p>

			<button
				className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
				onClick={() => router.push("/")}
			>
				Go back
			</button>
		</div>
	);
}
