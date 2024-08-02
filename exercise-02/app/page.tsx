"use client";

import {
	createAssociatedTokenAccountInstruction,
	createInitializeMintInstruction,
	createMintToCheckedInstruction,
	createTransferCheckedInstruction,
	getAssociatedTokenAddress,
	getMinimumBalanceForRentExemptMint,
	MINT_SIZE,
	TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
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

	// Token \/
	const [mintAccount, setMintAccount] = useState<Keypair | null>(null);
	const [tokenAccount, setTokenAccount] = useState<string | null>(null);
	const [tokenBalance, setTokenBalance] = useState(0);

	// handle creation of a token
	const fetchTokenBalance = useCallback(async () => {
		if (!publicKey) {
			throw new Error("Wallet is not connected");
		}

		if (!tokenAccount) {
			throw new Error("Token account is not created");
		}

		let balance = await connection.getTokenAccountBalance(
			new PublicKey(tokenAccount)
		);
		return Number(balance.value.amount) / LAMPORTS_PER_SOL;
	}, [publicKey, tokenAccount, connection]);

	const createToken = async () => {
		try {
			if (!publicKey) {
				toast.error("Wallet is not connected");
				throw new Error("Wallet is not connected");
			}
			if (!connection) {
				toast.error("Connection is not established");
				throw new Error("Connection is not established");
			}
			if (!signTransaction) {
				toast.error("Transaction signing is not available");
				throw new Error("Transaction signing is not available");
			}

			let mint = Keypair.generate();

			let transaction = new Transaction().add(
				SystemProgram.createAccount({
					fromPubkey: publicKey,
					newAccountPubkey: mint.publicKey,
					space: MINT_SIZE,
					lamports: await getMinimumBalanceForRentExemptMint(
						connection
					),
					programId: TOKEN_PROGRAM_ID,
				}),
				createInitializeMintInstruction(
					mint.publicKey,
					9,
					publicKey,
					publicKey
				)
			);

			// Create the associated token account
			const associatedTokenAccount = await getAssociatedTokenAddress(
				mint.publicKey,
				publicKey
			);

			transaction.add(
				createAssociatedTokenAccountInstruction(
					publicKey,
					associatedTokenAccount,
					publicKey,
					mint.publicKey
				)
			);

			transaction.feePayer = publicKey;
			const { blockhash } = await connection.getLatestBlockhash();
			transaction.recentBlockhash = blockhash;

			let signedTransaction = await signTransaction(transaction);
			signedTransaction.partialSign(mint);

			let signatureTx = await connection.sendRawTransaction(
				signedTransaction.serialize()
			);

			await connection
				.confirmTransaction(
					{
						signature: signatureTx,
						blockhash,
						lastValidBlockHeight: (
							await connection.getLatestBlockhash()
						).lastValidBlockHeight,
					},
					"confirmed"
				)
				.then(() => {
					toast.success("Token created successfully");
					setMintAccount(mint);
					setTokenAccount(associatedTokenAccount.toBase58());
				})
				.catch((err) => {
					toast.error("Transaction failed: " + err.message);
				});
			await fetchTokenBalance();
		} catch (err) {
			if (err instanceof Error) {
				console.error("Failed to create token:", err);
				toast.error("Transaction failed: " + err.message);
			} else {
				console.error("Failed to create token:", err);
				toast.error("Transaction failed");
			}
		}
	};

	useEffect(() => {
		if (publicKey && tokenAccount) {
			(async function getBalanceEvery10Seconds() {
				const newBalance = await fetchTokenBalance();
				setTokenBalance(newBalance);
				setTimeout(getBalanceEvery10Seconds, 10000);
			})();
		}
	}, [publicKey, connection, tokenAccount, tokenBalance, fetchTokenBalance]);

	// // handle token mint
	const [amountToMint, setAmountToMint] = useState<number>(1);

	const mintToken = async () => {
		if (!publicKey) {
			throw new Error("Wallet is not connected");
		}

		if (!mintAccount) {
			throw new Error("Mint account is not created");
		}

		if (!tokenAccount) {
			throw new Error("Token account is not created");
		}

		let tx = new Transaction().add(
			createMintToCheckedInstruction(
				mintAccount.publicKey,
				new PublicKey(tokenAccount),
				publicKey,
				amountToMint * LAMPORTS_PER_SOL,
				9
			)
		);

		let signature = await sendTransaction(tx, connection);
		await connection
			.confirmTransaction(signature, "confirmed")
			.then(() => {
				toast.success("Token minted successfully");
			})
			.catch((err) => {
				toast.error("Transaction failed: " + err.message);
			});
		await fetchTokenBalance();
	};

	// handle token transfer
	const [tokenReceiverPublicKey, setTokenReceiverPublicKey] =
		useState<string>("BvhV49WPYBbzPu8Fpy8YnPnwhNWLbm9Vmdj2T5bNSotS");
	const [amountToTransfer, setAmountToTransfer] = useState<number>(1);

	const transferToken = async () => {
		if (!publicKey) {
			throw new Error("Wallet is not connected");
		}

		if (!mintAccount) {
			throw new Error("Mint account is not created");
		}

		if (!tokenAccount) {
			throw new Error("Token account is not created");
		}

		try {
			let tx = new Transaction().add(
				createTransferCheckedInstruction(
					new PublicKey(tokenAccount),
					mintAccount.publicKey,
					new PublicKey(tokenReceiverPublicKey),
					publicKey,
					amountToTransfer * LAMPORTS_PER_SOL,
					9
				)
			);

			let signature = await sendTransaction(tx, connection);

			await connection.confirmTransaction(signature, "confirmed")
				.then(() => {
					toast.success("Token transferred successfully");
				})
				.catch((err) => {
					toast.error("Transaction failed: " + err.message);
				});
			await fetchTokenBalance();
		} catch (error) {
			console.error("Failed to transfer token:", error);
			toast.error(
				"Transaction failed: " +
					(error instanceof Error ? error.message : String(error))
			);
		}
	};

	// // handle burning the token supply
	// const burnToken = async () => {
	// 	if (!publicKey) {
	// 		throw new Error("Wallet is not connected");
	// 	}

	// 	if (!mintAccount) {
	// 		throw new Error("Mint account is not created");
	// 	}

	// 	if (!tokenAccount) {
	// 		throw new Error("Token account is not created");
	// 	}

	// 	let tx = new Transaction().add(
	// 		createBurnCheckedInstruction(
	// 			tokenAccount,
	// 			mintAccount.address,
	// 			publicKey,
	// 			1e8,
	// 			8
	// 		)
	// 	);

	// 	let signature = await sendTransaction(tx, connection);
	// 	await connection.confirmTransaction(signature, "confirmed");
	// };

	// // handle delegation of the ata of the token to another public key
	// const delegateToken = async () => {
	// 	if (!publicKey) {
	// 		throw new Error("Wallet is not connected");
	// 	}

	// 	if (!mintAccount) {
	// 		throw new Error("Mint account is not created");
	// 	}

	// 	if (!tokenAccount) {
	// 		throw new Error("Token account is not created");
	// 	}

	// 	let tx = new Transaction().add(
	// 		createSetAuthorityInstruction(
	// 			tokenAccount,
	// 			publicKey,
	// 			AuthorityType.AccountOwner,
	// 			new PublicKey(receiverPublicKey)
	// 		)
	// 	);

	// 	let signature = await sendTransaction(tx, connection);
	// 	await connection.confirmTransaction(signature, "confirmed");
	// };

	// const getBalances = async () => {
	// 	if (publicKey) {
	// 		if (tokenAccount) {
	// 			const balance = await getTokenAccountBalance();
	// 			if (balance) setTokenBalance(balance);
	// 		}
	// 	}
	// };

	// useEffect(() => {
	// 	if (publicKey) {
	// 		(async function getBalanceEvery10Seconds() {
	// 			const newBalance = await connection.getBalance(publicKey);
	// 			setBalance(newBalance / LAMPORTS_PER_SOL);
	// 			setTimeout(getBalanceEvery10Seconds, 10000);
	// 		})();

	// 		// getBalances();
	// 	}
	// 	// eslint-disable-next-line react-hooks/exhaustive-deps
	// }, [publicKey, connection, balance, tokenAccount]);

	// const [tokenBalance, setTokenBalance] = useState<number>(0);

	// // get token account balance
	// const getTokenAccountBalance = async () => {
	// 	if (!publicKey) {
	// 		throw new Error("Wallet is not connected");
	// 	}

	// 	if (!mintAccount) {
	// 		throw new Error("Mint account is not created");
	// 	}

	// 	if (!tokenAccount) {
	// 		throw new Error("Token account is not created");
	// 	}

	// 	let balance = await connection.getTokenAccountBalance(tokenAccount);
	// 	return balance.value.uiAmount;
	// };

	return (
		<main className="flex min-h-screen flex-col items-center justify-center">
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
								Get Airdrop
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

					<div className="flex flex-col gap-2 mt-8">
						<p className="text-2xl">Token</p>

						{mintAccount ? (
							<div className="flex flex-col gap-2">
								<p>Token created</p>
								<p>
									Mint Account:{" "}
									{mintAccount.publicKey.toString()}
								</p>
								<p>Token Account: {tokenAccount}</p>
								<p>Token Balance: {tokenBalance}</p>
							</div>
						) : null}

						<div className="flex flex-col gap-2">
							{tokenAccount && mintAccount ? (
								<>
									<div className="flex gap-2 w-full">
										<input
											type="number"
											className="bg-gray-900 text-white border border-gray-300 focus:outline-none focus:ring-4 focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:focus:ring-gray-700 w-3/4"
											value={amountToMint}
											min={0.0}
											max={9_000_000_000.0}
											onChange={(e) =>
												setAmountToMint(
													parseFloat(e.target.value)
												)
											}
											placeholder="Amount to Mint"
										/>
										<button
											onClick={mintToken}
											type="button"
											className="text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700 w-1/4"
										>
											Mint Token
										</button>
									</div>

									<div className="flex gap-2 w-full">
										<input
											type="text"
											className="bg-gray-900 text-white border border-gray-300 focus:outline-none focus:ring-4 focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:focus:ring-gray-700 w-1/3"
											value={tokenReceiverPublicKey}
											onChange={(e) =>
												setTokenReceiverPublicKey(
													e.target.value
												)
											}
											placeholder="Receiver Public Key"
										/>
										<input
											type="number"
											className="bg-gray-900 text-white border border-gray-300 focus:outline-none focus:ring-4 focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:focus:ring-gray-700 w-1/3"
											value={amountToTransfer}
											min={0.0}
											max={9_000_000_000.0}
											onChange={(e) =>
												setAmountToTransfer(
													parseFloat(e.target.value)
												)
											}
											placeholder="Amount to Transfer"
										/>
										<button
											onClick={transferToken}
											type="button"
											className="text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700 w-1/3"
										>
											Transfer Token
										</button>
									</div>
								</>
							) : (
								<button
									onClick={createToken}
									type="button"
									className="text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700"
								>
									Create Token
								</button>
							)}
						</div>
					</div>
				</div>
			) : (
				<div className="flex flex-col gap-4 pt-4">
					<h1>Wallet is not connected</h1>
				</div>
			)}
			<WalletMultiButton
				style={{
					marginTop: "1rem",
				}}
			/>
		</main>
	);
}
