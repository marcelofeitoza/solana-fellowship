use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::pubkey::Pubkey;

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct VaultState {
    pub is_initialized: bool,
    pub owner: Pubkey,
    pub total_deposits: u64,
}

impl VaultState {
    pub fn new(owner: Pubkey) -> Self {
        Self {
            is_initialized: true,
            owner,
            total_deposits: 0,
        }
    }
}
