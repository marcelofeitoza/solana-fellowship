use anchor_lang::prelude::*;
use anchor_spl::token::{transfer, Mint, Token, TokenAccount, Transfer};

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(
        mut,
        seeds = [b"vault", signer.key().as_ref()],
        bump
    )]
    /// CHECK: Struct field "token_account_owner_pda" is unsafe, but is not documented.
    token_account_owner_pda: AccountInfo<'info>,

    #[account(
        init_if_needed,
        seeds = [b"vault", mint_account.key().as_ref()],
        token::mint = mint_account,
        token::authority = token_account_owner_pda,
        payer = signer,
        bump
    )]
    pub vault: Account<'info, TokenAccount>,

    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(mut)]
    pub mint_account: Account<'info, Mint>,

    #[account(mut)]
    pub sender_token_account: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

impl<'info> Deposit<'info> {
    pub fn deposit(&mut self, amount: u64) -> Result<()> {
        let transfer_instruction = Transfer {
            from: self.sender_token_account.to_account_info(),
            to: self.vault.to_account_info(),
            authority: self.signer.to_account_info(),
        };

        let cpi_ctx = CpiContext::new(self.token_program.to_account_info(), transfer_instruction);

        transfer(cpi_ctx, amount)
    }
}
