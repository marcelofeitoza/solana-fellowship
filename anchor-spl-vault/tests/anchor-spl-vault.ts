import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { AnchorSplVault as Vault } from "../target/types/anchor_spl_vault";
import { PublicKey } from "@solana/web3.js";
import {
	Account,
	createMint,
	getAccount,
	getOrCreateAssociatedTokenAccount,
	mintTo,
	setAuthority,
	TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

async function airdropSol(publicKey: PublicKey, amount: number) {
	const provider = anchor.getProvider();
	const airdropTx = await provider.connection.requestAirdrop(
		publicKey,
		amount * anchor.web3.LAMPORTS_PER_SOL
	);
	await confirmTransaction(airdropTx);
}

async function confirmTransaction(tx: string) {
	const provider = anchor.getProvider();
	const { blockhash, lastValidBlockHeight } =
		await provider.connection.getLatestBlockhash();
	await provider.connection.confirmTransaction({
		blockhash,
		lastValidBlockHeight,
		signature: tx,
	});
}

async function createAccounts(count: number, amount: number) {
	const accounts: anchor.web3.Keypair[] = [];
	for (let i = 0; i < count; i++) {
		const account = anchor.web3.Keypair.generate();
		await airdropSol(account.publicKey, amount);
		console.log(`${i}: ${account.publicKey.toString()}`);
		accounts.push(account);
	}
	return accounts;
}

describe("AnchorSplVault", () => {
	const provider = anchor.AnchorProvider.env();
	anchor.setProvider(provider);

	const connection = provider.connection;
	const program = anchor.workspace.Vault as Program<Vault>;

	let walletAlice: anchor.web3.Signer;
	let walletBob: anchor.web3.Signer;
	let mintAlice: PublicKey;
	let ataAlice: Account;
	const amountAlice = 6;
	const decimals = 0;

	before(async () => {
		const accounts = await createAccounts(2, 10);
		walletAlice = accounts[0];
		walletBob = accounts[1];

		mintAlice = await createMint(
			connection,
			walletAlice,
			walletAlice.publicKey,
			null,
			decimals
		);
		console.log("mint Alice:", mintAlice.toBase58());

		ataAlice = await getOrCreateAssociatedTokenAccount(
			connection,
			walletAlice,
			mintAlice,
			walletAlice.publicKey
		);
		console.log("ATA Alice:", ataAlice.address.toBase58());

		await mintTo(
			connection,
			walletAlice,
			mintAlice,
			ataAlice.address,
			walletAlice.publicKey,
			amountAlice
		);
		await setAuthority(
			connection,
			walletAlice,
			mintAlice,
			walletAlice.publicKey,
			0,
			null
		);
		const tokenAccountInfo = await getAccount(connection, ataAlice.address);
		console.log(
			"Balance Token:",
			tokenAccountInfo.amount / BigInt(Math.pow(10, decimals))
		);
	});

	it("Initializes the vault", async () => {
		const [tokenAccountOwnerPda] = PublicKey.findProgramAddressSync(
			[Buffer.from("vault"), walletAlice.publicKey.toBuffer()],
			program.programId
		);
		console.log("TokenAccountOwnerPda:", tokenAccountOwnerPda.toBase58());

		const confirmOptions = { skipPreflight: true };

		const initVaultTx = await program.methods
			.initialize()
			.accountsPartial({
				tokenAccountOwnerPda,
				signer: walletAlice.publicKey,
				systemProgram: anchor.web3.SystemProgram.programId,
				tokenProgram: TOKEN_PROGRAM_ID,
				rent: anchor.web3.SYSVAR_RENT_PUBKEY,
			})
			.signers([walletAlice])
			.rpc(confirmOptions);

		await logTransaction(connection, initVaultTx);
	});

	it("Performs multiple deposits to the vault", async () => {
		const [vaultPda] = PublicKey.findProgramAddressSync(
			[Buffer.from("vault"), mintAlice.toBuffer()],
			program.programId
		);
		const [tokenAccountOwnerPda] = PublicKey.findProgramAddressSync(
			[Buffer.from("vault"), walletAlice.publicKey.toBuffer()],
			program.programId
		);

		let tx = await program.methods
			.deposit(new anchor.BN(3))
			.accountsPartial({
				tokenAccountOwnerPda,
				vault: vaultPda,
				signer: walletAlice.publicKey,
				mintAccount: mintAlice,
				senderTokenAccount: ataAlice.address,
				systemProgram: anchor.web3.SystemProgram.programId,
				tokenProgram: TOKEN_PROGRAM_ID,
			})
			.signers([walletAlice])
			.rpc();
		console.log("(deposit +3) Transaction:", tx);

		tx = await program.methods
			.deposit(new anchor.BN(2))
			.accountsPartial({
				tokenAccountOwnerPda,
				vault: vaultPda,
				signer: walletAlice.publicKey,
				mintAccount: mintAlice,
				senderTokenAccount: ataAlice.address,
				systemProgram: anchor.web3.SystemProgram.programId,
				tokenProgram: TOKEN_PROGRAM_ID,
			})
			.signers([walletAlice])
			.rpc();
		console.log("(deposit +2) Transaction:", tx);
	});

	it("Withdraws from the vault", async () => {
		const [vaultPda] = PublicKey.findProgramAddressSync(
			[Buffer.from("vault"), mintAlice.toBuffer()],
			program.programId
		);
		const [tokenAccountOwnerPda, bump] = PublicKey.findProgramAddressSync(
			[Buffer.from("vault"), walletAlice.publicKey.toBuffer()],
			program.programId
		);

		const tx = await program.methods
			.withdraw(new anchor.BN(3), bump)
			.accountsPartial({
				tokenAccountOwnerPda,
				vault: vaultPda,
				signer: walletAlice.publicKey,
				mintAccount: mintAlice,
				recipientTokenAccount: ataAlice.address,
				systemProgram: anchor.web3.SystemProgram.programId,
				tokenProgram: TOKEN_PROGRAM_ID,
			})
			.signers([walletAlice])
			.rpc();
		console.log("(withdraw -3) Transaction:", tx);
	});

	it("Closes the vault and transfers the remaining balance", async () => {
		const [vaultPda] = PublicKey.findProgramAddressSync(
			[Buffer.from("vault"), mintAlice.toBuffer()],
			program.programId
		);
		const [tokenAccountOwnerPda, bump] = PublicKey.findProgramAddressSync(
			[Buffer.from("vault"), walletAlice.publicKey.toBuffer()],
			program.programId
		);

		const tx = await program.methods
			.close()
			.accountsPartial({
				tokenAccountOwnerPda,
				vault: vaultPda,
				signer: walletAlice.publicKey,
				mintAccount: mintAlice,
				recipientTokenAccount: ataAlice.address,
				systemProgram: anchor.web3.SystemProgram.programId,
				tokenProgram: TOKEN_PROGRAM_ID,
			})
			.signers([walletAlice])
			.rpc();
		console.log("(close vault) Transaction:", tx);
	});
});

async function logTransaction(
	connection: anchor.web3.Connection,
	txHash: string
) {
	const { blockhash, lastValidBlockHeight } =
		await connection.getLatestBlockhash();
	await connection.confirmTransaction({
		blockhash,
		lastValidBlockHeight,
		signature: txHash,
	});
	console.log(
		`Transaction confirmed: https://explorer.solana.com/tx/${txHash}`
	);
}
