use clap::{Parser, Subcommand, ValueEnum};
use serde::{Deserialize, Serialize};
use solana_client::rpc_client::RpcClient;
use solana_sdk::{
    native_token::LAMPORTS_PER_SOL,
    pubkey::Pubkey,
    signature::{Keypair, Signature},
    signer::Signer,
};
use std::{error::Error, fs, str::FromStr};

const DEFAULT_CONFIG: &str = r#"{
    "network": "http://127.0.0.1:8899"
}"#;

#[derive(Serialize, Deserialize, Debug)]
struct AppConfig {
    network: String,
}

impl AppConfig {
    fn load_config(file_path: &str) -> Self {
        let contents = match fs::read_to_string(file_path) {
            Ok(contents) => contents,
            Err(_) => {
                let default_config: AppConfig =
                    serde_json::from_str(DEFAULT_CONFIG).expect("Failed to parse default config");
                default_config.save_config(file_path);
                serde_json::to_string(&default_config).expect("Failed to serialize default config")
            }
        };
        serde_json::from_str(&contents).expect("Failed to parse config file")
    }

    fn save_config(&self, file_path: &str) {
        let data: String = serde_json::to_string_pretty(&self).expect("Failed to serialize config");
        fs::write(file_path, data).expect("Failed to write config file");
    }
}

#[derive(Serialize, Deserialize)]
struct WalletKeypair {
    public_key: String,
    secret_key: String,
}

#[derive(Parser)]
#[clap(author, version, about)]
struct Cli {
    /// Path to the wallet keypair file
    #[clap(
        short,
        long,
        global = true,
        default_value = "my_wallet.json",
        help = "Global path to the wallet keypair file"
    )]
    wallet_file: String,

    #[clap(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Creates a new wallet keypair and saves it locally.
    Create {
        #[clap(short, long, help = "Optional path to save the keypair file")]
        file: Option<String>,
    },

    /// Gets the address of the wallet.
    Address {
        #[clap(short, long, help = "The public key of the wallet to get the address.")]
        wallet: String,
    },

    /// Requests an airdrop of SOL to a specified wallet.
    Airdrop {
        #[clap(
            short,
            long,
            help = "The public key of the wallet to receive the airdrop."
        )]
        wallet: String,
        #[clap(short, long, help = "The amount of SOL to request.")]
        amount: u64,
    },

    /// Transfers SOL from one wallet to another.
    Transfer {
        #[clap(
            short,
            long,
            help = "The public key of the sender wallet. Defaults to the wallet file."
        )]
        from: Option<String>,
        #[clap(short, long, help = "The public key of the recipient wallet.")]
        to: String,
        #[clap(short, long, help = "The amount of SOL to transfer.")]
        amount: f64,
    },

    /// Checks the balance of a specified wallet.
    Balance {
        #[clap(
            short,
            long,
            help = "The public key of the wallet to check the balance."
        )]
        wallet: String,
    },

    /// Lists all saved wallets.
    ListWallets {
        #[clap(short, long, help = "Path to the directory where wallets are saved.")]
        file: Option<String>,
    },

    /// Sets the network configuration.
    SetConfig {
        #[clap(short, long, help = "Network to set (localnet, devnet, testnet)")]
        network: Network,
    },
}

#[derive(Parser, ValueEnum, Clone, Debug)]
pub enum Network {
    Localnet,
    Devnet,
    Testnet,
}

impl From<Network> for String {
    fn from(network: Network) -> Self {
        match network {
            Network::Localnet => "http://127.0.0.1:8899".to_string(),
            Network::Devnet => "https://api.devnet.solana.com".to_string(),
            Network::Testnet => "https://api.testnet.solana.com".to_string(),
        }
    }
}

fn save_keypair(keypair: &Keypair, file_path: &str) -> Result<(), Box<dyn Error>> {
    let wallet = WalletKeypair {
        public_key: keypair.pubkey().to_string(),
        secret_key: bs58::encode(keypair.to_bytes()).into_string(),
    };
    let json = serde_json::to_string_pretty(&wallet)?;
    fs::write(file_path, json).map_err(|e| {
        eprintln!("Failed to save keypair at '{}': {}", file_path, e);
        e.into()
    })
}

fn read_keypair(file_path: &str) -> Result<Keypair, Box<dyn Error>> {
    let data = fs::read_to_string(file_path)
        .map_err(|e| {
            eprintln!("Failed to read keypair file '{}': {}", file_path, e);
        })
        .unwrap();
    let wallet: WalletKeypair = serde_json::from_str(&data)?;
    let bytes = bs58::decode(wallet.secret_key).into_vec()?;
    Keypair::from_bytes(&bytes).map_err(|e| {
        eprintln!("Failed to decode keypair from '{}': {}", file_path, e);
        e.into()
    })
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
    let config = AppConfig::load_config("./config.json");
    let rpc_client = RpcClient::new(config.network.clone());

    match &cli.command {
        Commands::Create { file } => {
            let keypair = Keypair::new();
            let file_path = file.as_deref().unwrap_or(&cli.wallet_file);
            save_keypair(&keypair, file_path)?;
            println!("Wallet created and saved to: {}", file_path);
            println!("Public key: {}", keypair.pubkey());
        }
        Commands::Address { wallet } => {
            let pubkey = Pubkey::from_str(wallet)?;
            println!("Address: {}", pubkey);
        }
        Commands::Airdrop { wallet, amount } => {
            let pubkey = Pubkey::from_str(wallet)?;
            let signature = request_airdrop(&rpc_client, &pubkey, *amount).await?;
            println!("Airdrop successful: Signature {}", signature);
        }
        Commands::Transfer { from, to, amount } => {
            let sender_keypair = match from {
                Some(path) => read_keypair(path)?,
                None => read_keypair(&cli.wallet_file)?,
            };
            let receiver_pubkey = Pubkey::from_str(to)?;
            let signature =
                transfer_funds(&rpc_client, &sender_keypair, &receiver_pubkey, *amount)?;
            println!("Transfer successful: Signature {}", signature);
        }
        Commands::Balance { wallet } => {
            let pubkey = Pubkey::from_str(wallet)?;
            let balance = rpc_client.get_balance(&pubkey)?;
            println!("Balance: {} SOL", balance as f64 / LAMPORTS_PER_SOL as f64);
        }
        Commands::SetConfig { network } => {
            let mut config = AppConfig::load_config("./config.json");
            config.network = network.clone().into();
            config.save_config("./config.json");
            println!("Network set to: {}", config.network);
        }
        Commands::ListWallets { file } => {
            let file_path = file.as_deref().unwrap_or(&cli.wallet_file);
            let data = fs::read_to_string(file_path)?;
            let wallet: WalletKeypair = serde_json::from_str(&data)?;
            println!("Public key: {}", wallet.public_key);
        }
    }

    Ok(())
}
