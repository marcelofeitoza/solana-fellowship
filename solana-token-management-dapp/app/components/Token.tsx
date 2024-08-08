import {
	createApproveCheckedInstruction,
	createAssociatedTokenAccountInstruction,
	createBurnCheckedInstruction,
	createCloseAccountInstruction,
	createInitializeMintInstruction,
	createMintToCheckedInstruction,
	createRevokeInstruction,
	createTransferCheckedInstruction,
	createTransferInstruction,
	getAssociatedTokenAddress,
	getAssociatedTokenAddressSync,
	getMinimumBalanceForRentExemptMint,
	MINT_SIZE,
	TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
	Keypair,
	PublicKey,
	LAMPORTS_PER_SOL,
	Transaction,
	SystemProgram,
} from "@solana/web3.js";
import { useState } from "react";
import { toast } from "react-toastify";

export const Token = () => {
	const { connection } = useConnection();
	const { publicKey, sendTransaction } = useWallet();
	const [mint, setMint] = useState<PublicKey | null>(null);
	const [tokenBalance, setTokenBalance] = useState<string>();

	const fetchTokenBalance = async (tokenAccount: PublicKey) => {
		if (!publicKey) {
			console.error("Wallet is not connected");
			return;
		}

		try {
			const balance = await connection.getTokenAccountBalance(
				tokenAccount
			);
			console.log("Token balance:", balance.value.uiAmount);
			setTokenBalance(balance.value.amount);
		} catch (error) {
			console.error("Failed to fetch token balance:", error);
		}
	};

	async function createToken() {
		if (!publicKey) {
			console.error("Wallet is not connected");
			return;
		}

		const mintKeypair = Keypair.generate();
		const lamports = await connection.getMinimumBalanceForRentExemption(
			MINT_SIZE
		);

		const transaction = new Transaction().add(
			SystemProgram.createAccount({
				fromPubkey: publicKey,
				newAccountPubkey: mintKeypair.publicKey,
				space: MINT_SIZE,
				lamports,
				programId: TOKEN_PROGRAM_ID,
			}),
			createInitializeMintInstruction(
				mintKeypair.publicKey,
				9,
				publicKey,
				publicKey
			)
		);

		try {
			transaction.feePayer = publicKey;
			transaction.recentBlockhash = (
				await connection.getRecentBlockhash()
			).blockhash;

			const signature = await sendTransaction(transaction, connection, {
				signers: [mintKeypair],
			});

			await connection.confirmTransaction(signature, "confirmed");
			setMint(mintKeypair.publicKey);
			console.log("Token created:", mintKeypair.publicKey.toString());
			toast.success("Token created successfully!");
		} catch (error) {
			console.error("Failed to create token:", error);
			toast.error("Failed to create token.");
		}
	}

	async function mintTokens() {
		if (!publicKey || !mint) {
			console.error("Wallet is not connected or mint not set.");
			return;
		}

		const ata = getAssociatedTokenAddressSync(mint, publicKey);

		let tx = new Transaction();
		tx.add(
			createAssociatedTokenAccountInstruction(
				publicKey,
				ata,
				publicKey,
				mint
			),
			createMintToCheckedInstruction(
				mint,
				ata,
				publicKey,
				100 * LAMPORTS_PER_SOL,
				9
			)
		);

		tx.feePayer = publicKey;
		tx.recentBlockhash = (await connection.getRecentBlockhash()).blockhash;

		try {
			const signature = await sendTransaction(tx, connection);
			await connection.confirmTransaction(signature, "confirmed");
			toast.success("Tokens minted successfully");
			fetchTokenBalance(ata);
		} catch (error) {
			console.error("Failed to mint tokens:", error);
			toast.error("Failed to mint tokens.");
		}
	}

	async function sendTokens() {
		if (!publicKey || !mint) {
			console.error("Wallet is not connected or mint not set.");
			return;
		}

		const receiver = new PublicKey(
			"8vU3WgmVnVDa13hXAevKA3Vhe7XtbwHrQja6aVx15KwV"
		);
		const senderATA = getAssociatedTokenAddressSync(mint, publicKey);
		const receiverATA = getAssociatedTokenAddressSync(mint, receiver);

		let tx = new Transaction();
		tx.add(
			createAssociatedTokenAccountInstruction(
				publicKey,
				receiverATA,
				receiver,
				mint
			),
			createTransferInstruction(
				senderATA,
				receiverATA,
				publicKey,
				1 * LAMPORTS_PER_SOL
			)
		);

		tx.feePayer = publicKey;
		tx.recentBlockhash = (await connection.getRecentBlockhash()).blockhash;

		try {
			const signature = await sendTransaction(tx, connection);
			await connection.confirmTransaction(signature, "confirmed");
			toast.success("Tokens sent successfully");
			fetchTokenBalance(senderATA);
		} catch (error) {
			console.error("Failed to send tokens:", error);
			toast.error("Failed to send tokens.");
		}
	}

	async function burnTokens() {
		if (!publicKey || !mint) {
			console.error("Wallet is not connected or mint not set.");
			return;
		}

		const ata = getAssociatedTokenAddressSync(mint, publicKey);

		let tx = new Transaction();
		tx.add(
			createBurnCheckedInstruction(
				ata,
				mint,
				publicKey,
				1 * LAMPORTS_PER_SOL,
				9
			)
		);

		tx.feePayer = publicKey;
		tx.recentBlockhash = (await connection.getRecentBlockhash()).blockhash;

		try {
			const signature = await sendTransaction(tx, connection);
			await connection.confirmTransaction(signature, "confirmed");
			toast.success("Tokens burned successfully");
			fetchTokenBalance(ata);
		} catch (error) {
			console.error("Failed to burn tokens:", error);
			toast.error("Failed to burn tokens.");
		}
	}

	async function delegate() {
		if (!publicKey || !mint) {
			console.error("Wallet is not connected or mint not set.");
			return;
		}

		const ata = getAssociatedTokenAddressSync(mint, publicKey);
		const delegate = new PublicKey(
			"8vU3WgmVnVDa13hXAevKA3Vhe7XtbwHrQja6aVx15KwV"
		);

		let tx = new Transaction();
		tx.add(
			createApproveCheckedInstruction(
				ata,
				mint,
				delegate,
				publicKey,
				1 * LAMPORTS_PER_SOL,
				9
			)
		);

		tx.feePayer = publicKey;
		tx.recentBlockhash = (await connection.getRecentBlockhash()).blockhash;

		try {
			const signature = await sendTransaction(tx, connection);
			await connection.confirmTransaction(signature, "confirmed");
			toast.success("Tokens delegated successfully");
		} catch (error) {
			console.error("Failed to delegate tokens:", error);
			toast.error("Failed to delegate tokens.");
		}
	}

	async function revokeDelegate() {
		if (!publicKey || !mint) {
			console.error("Wallet is not connected or mint not set.");
			return;
		}

		const ata = getAssociatedTokenAddressSync(mint, publicKey);

		let tx = new Transaction();
		tx.add(createRevokeInstruction(ata, publicKey));

		tx.feePayer = publicKey;
		tx.recentBlockhash = (await connection.getRecentBlockhash()).blockhash;

		try {
			const signature = await sendTransaction(tx, connection);
			await connection.confirmTransaction(signature, "confirmed");
			toast.success("Tokens revoked successfully");
		} catch (error) {
			console.error("Failed to revoke tokens:", error);
			toast.error("Failed to revoke tokens.");
		}
	}

	async function closeTokenAccount() {
		if (!publicKey || !mint) {
			console.error("Wallet is not connected or mint not set.");
			return;
		}

		const ata = getAssociatedTokenAddressSync(mint, publicKey);

		let tx = new Transaction();

		const balance = await connection.getTokenAccountBalance(ata);
		if (parseFloat(balance.value.amount) > 0) {
			toast.info(
				"Token account has balance. Sending tokens to another account."
			);

			const receiver = new PublicKey(
				"8vU3WgmVnVDa13hXAevKA3Vhe7XtbwHrQja6aVx15KwV"
			);
			const senderATA = getAssociatedTokenAddressSync(mint, publicKey);
			const receiverATA = getAssociatedTokenAddressSync(mint, receiver);

			tx.add(
				createAssociatedTokenAccountInstruction(
					publicKey,
					receiverATA,
					receiver,
					mint
				),
				createTransferInstruction(
					senderATA,
					receiverATA,
					publicKey,
					parseInt(balance.value.amount)
				)
			);
		}

		tx.add(createCloseAccountInstruction(ata, publicKey, publicKey));

		tx.feePayer = publicKey;
		tx.recentBlockhash = (await connection.getRecentBlockhash()).blockhash;

		try {
			const signature = await sendTransaction(tx, connection);
			await connection.confirmTransaction(signature, "confirmed");
			toast.success("Token account closed successfully");
			setMint(null);
			fetchTokenBalance(ata);
		} catch (error) {
			console.error("Failed to close token account:", error);
			toast.error("Failed to close token account.");
		}
	}

	return (
		<div className="flex flex-col gap-2 mt-8">
			<p className="text-2xl">Token</p>

			{mint ? (
				<div className="flex flex-col gap-2">
					<p>Token created</p>
					<p>Mint Account: {mint.toString()}</p>
					{tokenBalance ? (
						<>Token Balance: {parseInt(tokenBalance) / 10 ** 9}</>
					) : (
						<button
							onClick={async () =>
								fetchTokenBalance(
									await getAssociatedTokenAddress(
										mint,
										publicKey!
									)
								)
							}
							type="button"
							className="text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700"
						>
							Fetch Token Balance
						</button>
					)}
				</div>
			) : null}

			<div className="flex flex-col gap-2">
				{mint ? (
					<>
						<div className="w-full grid grid-cols-1 md:grid-cols-2 gap-2">
							<button
								onClick={mintTokens}
								type="button"
								className="text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700"
							>
								Mint Tokens
							</button>

							<div className="flex gap-2">
								<input
									type="text"
									className="bg-gray-900 text-white border border-gray-300 focus:outline-none focus:ring-4 focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:focus:ring-gray-700 w-3/4"
									value="8vU3WgmVnVDa13hXAevKA3Vhe7XtbwHrQja6aVx15KwV"
									readOnly
								/>
								<button
									onClick={sendTokens}
									type="button"
									className="text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 font-medium rounded-lg px-5 py-2.5 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700 w-1/4 text-xs"
								>
									Send Tokens
								</button>
							</div>

							<button
								onClick={burnTokens}
								type="button"
								className="text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700"
							>
								Burn Tokens
							</button>

							<button
								onClick={delegate}
								type="button"
								className="text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700"
							>
								Delegate
							</button>

							<button
								onClick={revokeDelegate}
								type="button"
								className="text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700"
							>
								Revoke Delegate
							</button>

							<button
								onClick={closeTokenAccount}
								type="button"
								className="text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700"
							>
								Close Token Account
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
	);
};
