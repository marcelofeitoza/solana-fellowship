"use client";
import { createQR } from "@solana/pay";
import Head from "next/head";
import Image from "next/image";
import { useCallback, useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function ChargingStation() {
	const [qrCode, setQrCode] = useState<string>();
	const [reference, setReference] = useState<string>();
	const [kwAmount, setKwAmount] = useState<number>(1);
	const [totalAmount, setTotalAmount] = useState<number>(0);
	const [isVerifying, setIsVerifying] = useState(false);
	const [retryCount, setRetryCount] = useState<number>(0);
	const router = useRouter();

	const ratePerKw = 0.0001; // 0.0001 SOL per kW

	useEffect(() => {
		setTotalAmount(kwAmount * ratePerKw);
	}, [kwAmount]);

	const handleGenerateClick = async () => {
		try {
			const res = await axios.post(
				"/api/pay",
				{ kwAmount },
				{
					headers: {
						"Content-Type": "application/json",
					},
				}
			);
			console.log(res.data);
			const { url, ref } = res.data;
			const qr = createQR(url);
			const qrBlob = await qr.getRawData("png");
			if (!qrBlob) return;
			const reader = new FileReader();
			reader.onload = (event) => {
				if (typeof event.target?.result === "string") {
					setQrCode(event.target.result);
				}
			};
			reader.readAsDataURL(qrBlob);
			setReference(ref);
			console.log(reference);
			handleVerify(ref);
		} catch (error) {
			console.error("Error generating QR code:", error);
		}
	};

	const handleVerify = useCallback(
		async (ref: string) => {
			if (!ref) {
				alert("Please generate a payment request first");
				return;
			}

			setIsVerifying(true);
			let wentThrough = false;
			let localRetryCount = retryCount;
			const maxRetries = 25;

			while (!wentThrough && localRetryCount < maxRetries) {
				console.log("Verifying payment...");
				try {
					const res = await axios.get(`/api/pay?reference=${ref}`);
					const { status } = res.data;
					if (status === "verified") {
						router.push("/success");
						wentThrough = true;
					}

					await delay(
						Math.min(1000 * Math.pow(2, localRetryCount), 1000 * 15)
					);
				} catch (error) {
					console.error("Error verifying payment:", error);
				}
				localRetryCount++;
				setRetryCount(localRetryCount);
			}

			if (!wentThrough) {
				alert("Failed to verify payment after multiple attempts.");
			}

			setIsVerifying(false);
		},
		[router, retryCount]
	);

	return (
		<>
			<Head>
				<title>DeVolt Payment</title>
				<meta
					name="description"
					content="Purchase EV charging rights"
				/>
				<meta
					name="viewport"
					content="width=device-width, initial-scale=1"
				/>
				<link rel="icon" href="/favicon.ico" />
			</Head>

			<main className="flex min-h-screen flex-col justify-center items-center bg-[#0f0f0f]">
				<h1 className="text-2xl font-semibold mb-4">DeVolt Payment</h1>
				{!qrCode && (
					<div className="mb-4 flex items-center">
						<label htmlFor="kwAmount" className="mr-2 text-lg">
							Amount of kW:
						</label>
						<input
							type="number"
							id="kwAmount"
							value={kwAmount}
							min={1}
							onChange={(e) =>
								setKwAmount(Number(e.target.value))
							}
							className="p-2 border border-gray-300 rounded-md text-black"
						/>
					</div>
				)}
				{qrCode && (
					<>
						<p className="text-sm text-gray-500 items-center justify-center flex flex-col">
							<Image
								src={qrCode}
								className="rounded-lg"
								alt="QR Code"
								width={300}
								height={300}
								priority
							/>
							Scan the QR code to make a payment
						</p>
					</>
				)}
				<p className="text-lg text-white mb-4">
					Total Amount: {totalAmount.toFixed(4)} SOL
				</p>
				{!reference && (
					<button
						className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
						onClick={handleGenerateClick}
					>
						Generate Payment Request
					</button>
				)}
				{retryCount >= 3 && (
					<button
						className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4"
						onClick={() => handleVerify(reference!)}
					>
						Verify Payment
					</button>
				)}
			</main>
		</>
	);
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
