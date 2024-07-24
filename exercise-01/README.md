# Solana CLI Wallet

## Overview

This CLI wallet application for Solana blockchain allows users to create new wallets, request airdrops, transfer SOL to other wallets, and check balances.

## Prerequisites

-   Rust and Cargo ([installation guide](https://www.rust-lang.org/tools/install))
-   Solana CLI tools ([installation guide](https://docs.solana.com/cli/install-solana-cli-tools))

## Setup

1. **Clone the Repository**

    ```sh
    git clone https://github.com/marcelofeitoza/solana-fellowship
    cd solana-fellowship/exercise-01
    ```

2. **Build the Project**
   Navigate to the project directory and run:

    ```sh
    cargo build --release
    ```

3. **Start Solana Test Validator**
   Before interacting with your CLI wallet, start the Solana test validator:
    ```sh
    solana-test-validator
    ```
    This will set up a local Solana blockchain that you can use for testing.
    - This is being used because the project is set up to use a local test validator, which is running on `http://localhost:8899`.

## Usage

1. **Create a Wallet**
   Generates a new wallet (keypair) and saves it locally.

    ```sh
    ./target/release/exercise-01 create-wallet
    ```

2. **Request Airdrop**
   Requests SOL from the local test validator.

    ```sh
    ./target/release/exercise-01 request-airdrop [PUBLIC_KEY] [AMOUNT]
    ```

    - Replace `[PUBLIC_KEY]` with your wallet's public key.
    - Replace `[AMOUNT]` with the number of SOL to request.

3. **Check Balance**
   Displays the balance of a specified wallet.

    ```sh
    ./target/release/exercise-01 balance [PUBLIC_KEY]
    ```

    - Replace `[PUBLIC_KEY]` with the wallet's public key.

4. **Transfer SOL**
   Transfers SOL from the primary wallet to another wallet.
    ```sh
    ./target/release/exercise-01 transfer [RECEIVER_PUBLIC_KEY] [AMOUNT]
    ```
    - Replace `[RECEIVER_PUBLIC_KEY]` with the recipient's public key.
    - Replace `[AMOUNT]` with the number of SOL to transfer.
