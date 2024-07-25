# Solana CLI Wallet (`scw`) - Exercise 01

## Overview

This CLI application is designed to interact with the Solana blockchain. It supports functionalities like creating wallets, requesting airdrops, transferring SOL between wallets, and querying account balances.

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

    Navigate to the project directory and build the project:

    ```sh
    cargo build --release
    ```

3. **Start Solana Test Validator**

    To interact with your CLI wallet, start the Solana test validator on another terminal:

    ```sh
    solana-test-validator
    ```

    This sets up a local Solana blockchain instance suitable for development and testing, running on `http://localhost:8899` (which is the default RPC URL on the project).

## Usage

### Create a Wallet

Generates a new wallet (keypair) and saves it to a specified file.

```sh
❯ scw create -f my_wallet.json
Wallet created and saved to: my_wallet.json
Public key: 5UGwCSzNHDUQLZr78LpNDFiynQ6S9zvB9rUCUa87ufv5

❯ scw create -f recipient_wallet.json
Wallet created and saved to: recipient_wallet.json
Public key: 3DgZaDJ2RUWdq1cjwCPEgVkM9wKXPBxHEoyKfsA4bk5F
```

### Request Airdrop

Requests SOL tokens from the test validator to the specified wallet.

```sh
❯ scw airdrop -w XyE2uztdZH4b58nX1VfcF5PQyZn5BQsjRQt2PHRFWfR -a 2
Airdrop successful: Signature 5Li85sA81p4FWe2u5QBb2RYAD7q7SPaBd5UHrjmU9bbXTsy5BHpe7qZh8YXhTSUdW5dNzJkUTTS9feSPu3DF1EL1
```

### Check Balance

Displays the balance of a specified wallet.

```sh
❯ scw balance -w XyE2uztdZH4b58nX1VfcF5PQyZn5BQsjRQt2PHRFWfR
Balance: 2 SOL

❯ scw balance -w D5RRG81T72Faaw4GqCgQr54roRkgmB2GXCsGK8GXu9Hu
Balance: 0 SOL
```

### Transfer SOL

Transfers SOL from one wallet to another using specified public keys.

```sh
❯ scw transfer -f my_wallet.json -t D5RRG81T72Faaw4GqCgQr54roRkgmB2GXCsGK8GXu9Hu -a 0.5
Transfer successful: Signature 5jbPjga3ZDCgpw3EwVCiaRDqEcRKK2di1uxCr6GRyL2NJf9zNfxcP6C8qREiguamWYmNB8qgsodxevexKBG7NsLq

❯ scw balance -w XyE2uztdZH4b58nX1VfcF5PQyZn5BQsjRQt2PHRFWfR # Sender
Balance: 1.499995

❯ scw balance -w D5RRG81T72Faaw4GqCgQr54roRkgmB2GXCsGK8GXu9Hu # Receiver
Balance: 0.5 SOL
```

### Set Network Configuration

Set the network to localnet, devnet, or testnet.

```sh
❯ scw set-config -n devnet
Network set to: https://api.devnet.solana.com
```

### List Wallets

Lists all saved wallets and their details from a specified directory or file.

```sh
❯ scw list-wallets -f my_wallet.json
Public key: XyE2uztdZH4b58nX1VfcF5PQyZn5BQsjRQt2PHRFWfR

❯ scw list-wallets -f recipient_wallet.json
Public key: D5RRG81T72Faaw4GqCgQr54roRkgmB2GXCsGK8GXu9Hu
```
