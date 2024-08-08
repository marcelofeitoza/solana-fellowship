# Solana Token Management DApp

![preview](https://github.com/user-attachments/assets/fcc5c528-38a9-41b7-a6ad-9ff4e67815c9)

## Overview

This project is a decentralized application (dApp) built on the Solana blockchain. It provides a comprehensive interface for managing a custom Solana token. Users can create tokens, mint new tokens to their wallet, transfer tokens to other wallets, burn tokens to reduce supply, delegate token handling, and close token accounts.

## Features

- **Token Creation**: Users can create a new token with a specified decimal amount.
- **Minting Tokens**: Users can mint new tokens to any specified wallet.
- **Transferring Tokens**: Allows users to transfer tokens between accounts.
- **Burning Tokens**: Users can burn tokens to reduce the total supply.
- **Delegating Tokens**: Token owners can delegate others to manage their tokens.
- **Closing Token Accounts**: Users can close their token accounts to retrieve SOL spent on rent.

## Running

Follow these steps to get your development environment set up:

1. Install the dependencies:
   ```bash
   pnpm i # or yarn
   ```

2. Run the application:
   ```bash
   pnpm build && pnpm start # or yarn build && yarn start
   ```

## Usage

Once the application is running, you can interact with it through the web UI at `http://localhost:3000`.

- **Create Token**: Click on the "Create Token" button and follow the prompts.
- **Mint Tokens**: Enter the amount and click "Mint Tokens".
- **Send Tokens**: Provide the recipient's wallet address and amount, then click "Send Tokens".
- **Burn Tokens**: Enter the amount of tokens you want to burn and confirm.
- **Delegate**: Enter the delegate's wallet address and the amount.
- **Revoke Delegation**: Simply click the "Revoke Delegate" to remove delegation.
- **Close Account**: To close the token account, just click "Close Token Account".

## Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

## License

Distributed under the MIT License. See `LICENSE` for more information.

## Contact

Your Name - [@your_twitter](https://twitter.com/your_twitter) - email@example.com

Project Link: [https://github.com/your-github/solana-token-dapp](https://github.com/your-github/solana-token-dapp)

```

Esse README é apenas um ponto de partida. Você pode e deve personalizá-lo de acordo com as especificidades do seu projeto, adicionando detalhes como screenshots da interface, seções adicionais sobre segurança, testes, ou outras funcionalidades que seu projeto possa ter.
