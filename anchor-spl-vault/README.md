# Anchor SPL Vault

## Overview

The Anchor SPL Vault project is a Solana program designed to handle deposits, withdrawals, and closing of vaults that hold SPL tokens. The program leverages Anchor, a framework for Solana programs, to simplify development and interaction with the Solana blockchain.

1. **Build the Project**

    Navigate to the project directory and build the Solana program:

    ```sh
    anchor build
    ```

2. **Deploy the Program**

    Deploy the Solana program to a localnet or devnet:

    ```sh
    anchor deploy
    ```

    Make sure your `Anchor.toml` is configured with the correct cluster URL (e.g., localnet or devnet).

## Running Tests

To test the functionalities of the SPL Vault, follow these steps:

1. **Start Solana Test Validator**

    Before running the tests, ensure you have a local Solana validator running:

    ```sh
    solana-test-validator
    ```

2. **Run the Tests**

    Execute the test suite using the following command:

    ```sh
    anchor test --skip-local-validator
    ```

    The tests will create vaults, deposit tokens, withdraw tokens, and finally close the vault, verifying that all operations work correctly.

### Example Test Output

```sh
AnchorSplVault
0: 9137EB7G9fsQVkY2oKLVUgrVHJWgR3uCjuUiX8XZoyYp
1: 9MYhbnJUdRX3iS2GczVxuChbzS62aZvPSBZLaTbe7QV7
mint Alice: 8TXTzHQhtMdujUzZA9ab2F9oiyd6xNdrgXU2GGWfW1gH
ATA Alice: DhKAXC83dfnP8mVDo2J8NC1fVoun5VF1VfrXngtvBPbe
Balance Token: 6n
TokenAccountOwnerPda: AUQbUm3WPSW8Gx3YypkTJXv61iw1h2Mu8JKjKZdw4pkw
Transaction confirmed: https://explorer.solana.com/tx/2FGgpu8Ptw64V4r2ZzTo8MWEFUJnMZ7eFoKS1ZJ8zozrkSAmuX4D6Rri7HfeBNJekywSt5GqYazoWsWwn77cSpes
    ✔ Initializes the vault (462ms)
(deposit +3) Transaction: 3iWq3Zmgo5oqyeaiUZqzHVmX8aQ829D6F7ipK2w459Czap4Usp99anMakij1wJgQtK9VNh8A2RsUxD9RWyQGTyQR
(deposit +2) Transaction: cdW3PtnffqHa4VRcQJXSWLpLjxsRy7YEnbkoCfzcRFiRsbL7z8DUUmJDeFvWXorUKwXRCHpqS5U5Sj5kp8yNod4
    ✔ Performs multiple deposits to the vault (933ms)
(withdraw -3) Transaction: 5JdcTGA1FXT1p5bGG8j7Gv96p1do54qhZireYE8e8Jjz3bj7h92vskGaNG5twGHrtoFBSuWn4EQMSjwuwCTUY78N
    ✔ Withdraws from the vault (465ms)
(close vault) Transaction: ocEU7Qbma2w3etVD31SgASZkBBScxHjgSwDtVikVqhzcukjk7vcJFoXkCzWYQMk9yiE6zRJmVhtdQTdCVqp3UxD
    ✔ Closes the vault and transfers the remaining balance (462ms)

  4 passing (5s)
```

## Usage

### Initializing a Vault

Initialize a vault for depositing SPL tokens:

```rust
let initVaultTx = await program.methods
    .initialize()
    .accounts({
        tokenAccountOwnerPda,
        signer: walletAlice.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
    })
    .signers([walletAlice])
    .rpc(confirmOptions);
```

### Depositing Tokens

Deposit SPL tokens into the vault:

```rust
let tx = await program.methods
    .deposit(new anchor.BN(3))
    .accounts({
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
```

### Withdrawing Tokens

Withdraw SPL tokens from the vault:

```rust
const tx = await program.methods
    .withdraw(new anchor.BN(3), bump)
    .accounts({
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
```

### Closing the Vault

Close the vault and transfer any remaining tokens:

```rust
const tx = await program.methods
    .close()
    .accounts({
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
```
