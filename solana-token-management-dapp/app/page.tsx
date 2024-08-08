"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import {
	Keypair,
	LAMPORTS_PER_SOL,
	PublicKey,
	SystemProgram,
	Transaction,
} from "@solana/web3.js";
import { toast } from "react-toastify";

import { useCallback, useEffect, useState } from "react";
import { Token } from "./components/Token";

export default function Home() {
	const { connection } = useConnection();
	const { publicKey, sendTransaction, signTransaction } = useWallet();
	const [balance, setBalance] = useState<number>(0);

	const getBalance = useCallback(async () => {
		if (publicKey) {
			const newBalance = await connection.getBalance(publicKey);
			return newBalance / LAMPORTS_PER_SOL;
		}

		return 0;
	}, [publicKey, connection]);

	useEffect(() => {
		if (publicKey) {
			(async function getBalanceEvery5Seconds() {
				const newBalance = await getBalance();
				setBalance(newBalance);
				setTimeout(getBalanceEvery5Seconds, 5000);
			})();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [publicKey, connection, balance]);

	const getAirdropOnClick = async () => {
		try {
			if (!publicKey) {
				throw new Error("Wallet is not Connected");
			}
			const [latestBlockhash, signature] = await Promise.all([
				connection.getLatestBlockhash(),
				connection.requestAirdrop(
					publicKey,
					Math.floor(Math.random() * 5 + 1) * LAMPORTS_PER_SOL
				),
			]);

			const signResult = await connection.confirmTransaction(
				{ signature, ...latestBlockhash },
				"confirmed"
			);

			if (signResult) {
				toast.success("Airdrop was successful!");
				setBalance(await getBalance());
			}
		} catch (err) {
			toast.error("Airdrop failed");
			console.error(`AirDrop failed: ${err}`);
		}
	};

	const [solAmount, setSolAmount] = useState(0.5);
	const [receiverPublicKey, setReceiverPublicKey] = useState<string>(
		"BvhV49WPYBbzPu8Fpy8YnPnwhNWLbm9Vmdj2T5bNSotS"
	);

	const transferSol = async () => {
		try {
			if (!publicKey) {
				throw new Error("Wallet is not Connected");
			}
			const transaction = new Transaction().add(
				SystemProgram.transfer({
					fromPubkey: publicKey,
					toPubkey: new PublicKey(receiverPublicKey),
					lamports: solAmount * LAMPORTS_PER_SOL,
				})
			);
			const signature = await sendTransaction(transaction, connection);
			const sigResult = await connection.confirmTransaction(
				signature,
				"confirmed"
			);
			if (sigResult) {
				toast.success("Transaction was successful!");
			}
		} catch (err) {
			toast.error("Transaction failed");
			console.error(`Transaction failed: ${err}`);
		}
	};

	return (
		<main className="flex min-h-screen flex-col items-center justify-center">
			<header className="absolute top-0 left-0 right-0 flex items-center justify-end p-4 border-b border-gray-700">
				<WalletMultiButton
					style={{
						backgroundColor: "#2d2d2d",
						color: "#ffffff",
						border: "1px solid #4b5563",
						borderRadius: "0.375rem",
						padding: "0.625rem 1.25rem",
						fontSize: "1rem",
						fontWeight: "500",
						lineHeight: "1.5",
						textTransform: "none",
						letterSpacing: "0.015em",
						cursor: "pointer",
					}}
				/>
			</header>
			{publicKey ? (
				<div className="flex flex-col gap-4 pt-4">
					<h1>Your Public key is: {publicKey.toString()}</h1>
					<div className="flex flex-col gap-2 justify-center">
						<div className="flex items-center gap-2 justify-between">
							<h2>Your Balance is: {balance} SOL</h2>
							<button
								onClick={getAirdropOnClick}
								type="button"
								className="text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700"
							>
								DJxGgYpFKybqwx9ef1q4eMDFukTdxEXgcYwrJScp18UH Get
								Airdrop
							</button>
						</div>
					</div>

					<div className="flex flex-col gap-2 mt-8">
						<p className="text-2xl">SOL</p>
						<div className="flex gap-2">
							<input
								type="number"
								className="bg-gray-900 text-white border border-gray-300 focus:outline-none focus:ring-4 focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:focus:ring-gray-700 w-1/4"
								value={solAmount}
								min={0.0}
								max={9_000_000_000.0}
								onChange={(e) =>
									setSolAmount(parseFloat(e.target.value))
								}
								placeholder="Amount of SOL"
							/>
							<input
								type="text"
								className="bg-gray-900 text-white border border-gray-300 focus:outline-none focus:ring-4 focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:focus:ring-gray-700 w-1/2"
								value={receiverPublicKey}
								onChange={(e) =>
									setReceiverPublicKey(e.target.value)
								}
								placeholder="Receiver Public Key"
							/>
							<button
								onClick={transferSol}
								type="button"
								className="text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700 w-1/4"
							>
								Transfer SOL
							</button>
						</div>
					</div>

					<Token />
				</div>
			) : (
				<div className="flex flex-col gap-4 pt-4 items-center">
					<h1>Please Connect your wallet to continue</h1>
					<WalletMultiButton
						style={{
							backgroundColor: "#2d2d2d",
							color: "#ffffff",
							border: "1px solid #4b5563",
							borderRadius: "0.375rem",
							padding: "0.625rem 1.25rem",
							fontSize: "1rem",
							fontWeight: "500",
							lineHeight: "1.5",
							textTransform: "none",
							letterSpacing: "0.015em",
							cursor: "pointer",
						}}
					/>
				</div>
			)}
		</main>
	);
}
