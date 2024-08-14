use anchor_lang::prelude::*;
use anchor_spl::token::{transfer, Mint, Token, TokenAccount, Transfer};

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(
        mut,
        seeds = [b"vault".as_ref(), signer.key().as_ref()],
        bump
    )]
    /// CHECK: Struct field "token_account_owner_pda" is unsafe, but is not documented.
    token_account_owner_pda: AccountInfo<'info>,

    #[account(mut)]
    pub vault: Account<'info, TokenAccount>,

    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(mut)]
    pub mint_account: Account<'info, Mint>,

    #[account(mut)]
    pub recipient_token_account: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

impl<'info> Withdraw<'info> {
    pub fn withdraw(&mut self, amount: u64, vault_bump: u8) -> Result<()> {
        let transfer_instruction = Transfer {
            from: self.vault.to_account_info(),
            to: self.recipient_token_account.to_account_info(),
            authority: self.token_account_owner_pda.to_account_info(),
        };

        let signer_key = self.signer.key();
        let seeds = &[b"vault", signer_key.as_ref(), &[vault_bump]];
        let signer_seeds = &[&seeds[..]];

        let cpi_ctx = CpiContext::new_with_signer(
            self.token_program.to_account_info(),
            transfer_instruction,
            signer_seeds,
        );

        transfer(cpi_ctx, amount)
    }
}
