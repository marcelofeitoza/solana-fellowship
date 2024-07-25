#!/bin/sh

execute() {
    echo "Executing: $@"
    $@
    if [ $? -ne 0 ]; then
        echo "Error: Command failed - $@"
        exit 1
    fi 
}

# Build the project
execute cargo build --release

# Create Wallets
execute ./target/release/scw create -f my_wallet.json
echo "Contents of my_wallet.json:"
cat my_wallet.json

execute ./target/release/scw create -f recipient_wallet.json
echo "Contents of recipient_wallet.json:"
cat recipient_wallet.json

# Extract public keys
MY_WALLET_PUBKEY=$(jq -r '.public_key' my_wallet.json)
RECIPIENT_WALLET_PUBKEY=$(jq -r '.public_key' recipient_wallet.json)

# Debug: Display the extracted public keys
echo "My Wallet Public Key: $MY_WALLET_PUBKEY"
echo "Recipient Wallet Public Key: $RECIPIENT_WALLET_PUBKEY"

# Request Airdrop
execute ./target/release/scw airdrop -w $MY_WALLET_PUBKEY -a 2

# Check Balance
execute ./target/release/scw balance -w $MY_WALLET_PUBKEY
execute ./target/release/scw balance -w $RECIPIENT_WALLET_PUBKEY

# Transfer SOL
execute ./target/release/scw transfer -f my_wallet.json -t $RECIPIENT_WALLET_PUBKEY -a 0.5

# Check Balance Again
execute ./target/release/scw balance -w $MY_WALLET_PUBKEY
execute ./target/release/scw balance -w $RECIPIENT_WALLET_PUBKEY

# List Wallets
execute ./target/release/scw list-wallets -f my_wallet.json
execute ./target/release/scw list-wallets -f recipient_wallet.json