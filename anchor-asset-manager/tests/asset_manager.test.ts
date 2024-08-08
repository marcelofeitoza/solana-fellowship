import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { AssetManager } from "../target/types/asset_manager";
import {
	createMint,
	getOrCreateAssociatedTokenAccount,
	mintTo,
	getAccount,
	TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

describe("asset_manager", () => {
	anchor.setProvider(anchor.AnchorProvider.env());

	const program = anchor.workspace.AssetManager as Program<AssetManager>;

	let mint = null;
	let userTokenAccount = null;
	let vaultAccount = null;
	const user = anchor.web3.Keypair.generate();

	beforeAll(async () => {
		// Creating a mint
		mint = await createMint(
			program.provider.connection,
			user, // payer and authority
			user.publicKey, // mint authority
			null, // freeze authority
			9 // decimals
		);

		// Creating associated token accounts for the user
		userTokenAccount = await getOrCreateAssociatedTokenAccount(
			program.provider.connection,
			user, // payer
			mint,
			user.publicKey // owner of the token account
		);

		// Creating a vault account for the program itself
		vaultAccount = await getOrCreateAssociatedTokenAccount(
			program.provider.connection,
			user, // payer
			mint,
			program.programId // owner of the vault will be the program itself
		);

		// Minting tokens to the user's token account
		await mintTo(
			program.provider.connection,
			user, // payer
			mint,
			userTokenAccount.address,
			user.publicKey, // mint authority
			1000 * 10 ** 9 // amount to mint, adjusted for decimals
		);
	});

	it("Should deposit and withdraw funds correctly", async () => {
		// Perform a deposit
		const depositTx = await program.methods
			.deposit(new anchor.BN(1000))
			.accounts({
				user: user.publicKey,
				userTokenAccount: userTokenAccount.address,
				vaultAccount: vaultAccount.address,
				tokenProgram: TOKEN_PROGRAM_ID,
			})
			.signers([user])
			.rpc();
		console.log("Deposit transaction signature:", depositTx);

		// Perform a withdrawal
		const withdrawTx = await program.methods
			.withdraw(new anchor.BN(1000))
			.accounts({
				user: user.publicKey,
				userTokenAccount: userTokenAccount.address,
				vaultAccount: vaultAccount.address,
				tokenProgram: TOKEN_PROGRAM_ID,
			})
			.signers([user])
			.rpc();
		console.log("Withdraw transaction signature:", withdrawTx);
	});
});
