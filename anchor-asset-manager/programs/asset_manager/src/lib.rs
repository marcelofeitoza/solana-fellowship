use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("4ZnUCr6vS61XWvbsUQU1giuUZcJfiSZPzy7med9N7PrP");

#[program]
pub mod asset_manager {
    use super::*;

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        msg!("Attempting to deposit {} tokens to the vault", amount);

        // Require the user has balance to deposit
        require!(
            ctx.accounts.user_token_account.amount >= amount,
            ErrorCode::NotEnoughBalance
        );

        let cpi_accounts = Transfer {
            from: ctx.accounts.user_token_account.to_account_info(),
            to: ctx.accounts.vault_account.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, amount)?;

        msg!("Successfully deposited {} tokens to the vault", amount);
        Ok(())
    }

    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        msg!("Attempting to withdraw {} tokens from the vault", amount);

        // Require the user has balance to withdraw
        require!(
            ctx.accounts.vault_account.amount >= amount,
            ErrorCode::NotEnoughBalance
        );

        if ctx.accounts.user_token_account.owner != ctx.accounts.user.key() {
            msg!("Unauthorized attempt to withdraw tokens");
            return Err(ErrorCode::Unauthorized.into());
        }

        let cpi_accounts = Transfer {
            from: ctx.accounts.vault_account.to_account_info(),
            to: ctx.accounts.user_token_account.to_account_info(),
            authority: ctx.accounts.vault.to_account_info(), // This should be the vault's authority
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, amount)?;

        msg!("Successfully withdrew {} tokens from the vault", amount);
        Ok(())
    }
}

#[error_code]
pub enum ErrorCode {
    #[msg("You are not authorized to perform this operation.")]
    Unauthorized,
    #[msg("Not enough balance to perform the operation.")]
    NotEnoughBalance,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub vault_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub vault_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    /// ADD: Vault's authority must sign the withdrawal, not the user.
    pub vault: Signer<'info>,
}
