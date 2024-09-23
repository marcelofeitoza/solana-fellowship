# cNFT Collection and Airdrop

This project demonstrates the creation and airdrop of a cNFT collection featuring a profile picture and social links as metadata on the Solana blockchain. The NFTs are minted using the `@metaplex-foundation/mpl-bubblegum` library and are then airdropped to a predefined list of fellows.

## Features

-   **NFT Minting**: Mint NFTs with embedded metadata including images and social links.
-   **Airdrop**: Automatically airdrop minted NFTs to a list of predefined wallet addresses.
-   **Merkle Tree**: Utilize Merkle trees for efficient and verifiable batch airdrops.

## Setup

1. **Install dependencies**:
    ```bash
    yarn install
    ```

## Running the Application

1. **Update the keypair.json**:

    - Replace `keypair.json` with your Solana wallet keypair file. This wallet will be used to sign transactions and must have enough SOL to cover transaction fees.

2. **Run the script**:
    ```bash
    npx ts-node index.ts
    ```
    - This will mint NFTs and airdrop them to the specified addresses in the `index.ts` file.

## How It Works

-   **Minting Process**:
    The script reads from a list of wallet addresses and mints an NFT for each address. Metadata for the NFTs includes a profile picture and social media links, which are specified in the script.

-   **Airdrop Mechanism**:
    After minting, the NFTs are automatically transferred to the predefined wallet addresses using the Solana blockchain's transaction capabilities.

## Common Issues

-   **Funding**: Ensure that the wallet specified in `keypair.json` has sufficient SOL to cover all transaction fees associated with minting and sending NFTs. It was needed around 0.25 SOL.
