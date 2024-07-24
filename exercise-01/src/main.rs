use clap::{Parser, Subcommand};
use serde::{Deserialize, Serialize};
use solana_client::rpc_client::RpcClient;
use solana_sdk::{
    native_token::LAMPORTS_PER_SOL,
    pubkey::Pubkey,
    signature::{Keypair, Signature},
    signer::Signer,
};
use std::{error::Error, fs, str::FromStr};

#[derive(Serialize, Deserialize)]
struct WalletKeypair {
    public_key: String,
    secret_key: String,
}

#[derive(Parser)]
#[clap(author, version, about, long_about = None)]
struct Cli {
    #[clap(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    Create,
    RequestAirdrop {
        #[clap(value_parser)]
        pubkey: String,
        #[clap(value_parser)]
        amount: u64,
    },
    Transfer {
        #[clap(value_parser)]
        to_pubkey: String,
        #[clap(value_parser)]
        amount: f64,
    },
    Balance {
        #[clap(value_parser)]
        pubkey: String,
    },
}

fn save_keypair(keypair: &Keypair) -> Result<(), Box<dyn Error>> {
    let wallet = WalletKeypair {
        public_key: keypair.pubkey().to_string(),
        secret_key: bs58::encode(keypair.to_bytes()).into_string(),
    };
    let json = serde_json::to_string_pretty(&wallet)?;
    fs::write("wallet_keypair.json", json)?;
    Ok(())
}

fn read_keypair() -> Result<Keypair, Box<dyn Error>> {
    let data = fs::read_to_string("wallet_keypair.json")?;
    let wallet: WalletKeypair = serde_json::from_str(&data)?;
    let bytes = bs58::decode(wallet.secret_key).into_vec()?;
    Ok(Keypair::from_bytes(&bytes)?)
}

async fn request_airdrop(
    rpc_client: &RpcClient,
    pubkey: &Pubkey,
    amount_sol: u64,
) -> Result<Signature, Box<dyn Error>> {
    let sig = rpc_client.request_airdrop(pubkey, amount_sol * LAMPORTS_PER_SOL)?;
    loop {
        let confirmed = rpc_client.confirm_transaction(&sig)?;
        if confirmed {
            break;
        }
    }
    Ok(sig)
}

fn transfer_funds(
    rpc_client: &RpcClient,
    sender_keypair: &Keypair,
    receiver_pub_key: &Pubkey,
    amount_sol: f64,
) -> Result<Signature, Box<dyn Error>> {
    let amount_lamports = (amount_sol * LAMPORTS_PER_SOL as f64) as u64;

    let latest_blockhash = match rpc_client.get_latest_blockhash() {
        Ok(blockhash) => blockhash,
        Err(e) => return Err(Box::new(e)),
    };

    let transaction = solana_sdk::transaction::Transaction::new_signed_with_payer(
        &[solana_sdk::system_instruction::transfer(
            &sender_keypair.pubkey(),
            receiver_pub_key,
            amount_lamports,
        )],
        Some(&sender_keypair.pubkey()),
        &[sender_keypair],
        latest_blockhash,
    );

    rpc_client
        .send_and_confirm_transaction(&transaction)
        .map_err(|e| e.into())
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    let cli = Cli::parse();

    let rpc_client = RpcClient::new("http://127.0.0.1:8899".to_string());

    match &cli.command {
        Commands::Create => {
            let keypair = Keypair::new();
            save_keypair(&keypair)?;
            println!("Wallet created successfully: {}", keypair.pubkey());
        }
        Commands::RequestAirdrop { pubkey, amount } => {
            let pubkey = Pubkey::from_str(pubkey)?;
            let signature = request_airdrop(&rpc_client, &pubkey, *amount).await?;
            println!("Airdrop successful: Signature {}", signature);
        }
        Commands::Transfer { to_pubkey, amount } => {
            let sender_keypair = read_keypair()?;
            let receiver_pubkey = Pubkey::from_str(to_pubkey)?;
            let signature =
                transfer_funds(&rpc_client, &sender_keypair, &receiver_pubkey, *amount)?;
            println!("Transfer successful: Signature {}", signature);
        }
        Commands::Balance { pubkey } => {
            let pubkey = Pubkey::from_str(pubkey)?;
            let balance = rpc_client.get_balance(&pubkey)?;
            println!("Balance: {} SOL", balance as f64 / LAMPORTS_PER_SOL as f64);
        }
    }

    Ok(())
}
