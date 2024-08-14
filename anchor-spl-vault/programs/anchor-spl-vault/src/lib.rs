use anchor_lang::prelude::*;

mod context;
use context::*;

declare_id!("7MMM9sKJRa1kckgY6esnhvmS5pPBUTF9xMjoUxfHrhHA");

#[program]
pub mod anchor_spl_vault {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        ctx.accounts.deposit(amount)
    }

    pub fn withdraw(ctx: Context<Withdraw>, amount: u64, vault_bump: u8) -> Result<()> {
        ctx.accounts.withdraw(amount, vault_bump)
    }

    pub fn close(ctx: Context<Close>) -> Result<()> {
        ctx.accounts.close(ctx.bumps.token_account_owner_pda)
    }
}
