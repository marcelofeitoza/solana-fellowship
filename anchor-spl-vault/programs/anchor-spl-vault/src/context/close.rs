use anchor_lang::prelude::*;
use anchor_spl::token::{
    close_account, transfer, CloseAccount, Mint, Token, TokenAccount, Transfer,
};

#[derive(Accounts)]
pub struct Close<'info> {
    #[account(
        mut,
        seeds = [b"vault", signer.key().as_ref()],
        bump
    )]
    /// CHECK: This is safe because we are only using this for PDA checks and CPI
    pub token_account_owner_pda: AccountInfo<'info>,

    #[account(
        mut,
        close = signer // The signer receives the remaining rent from closing the account
    )]
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

impl<'info> Close<'info> {
    pub fn close(&self, bump: u8) -> Result<()> {
        // Transfer remaining tokens from the vault to the recipient's token account
        let transfer_instruction = Transfer {
            from: self.vault.to_account_info(),
            to: self.recipient_token_account.to_account_info(),
            authority: self.token_account_owner_pda.to_account_info(),
        };

        let signer_key = self.signer.key();
        let seeds = &[
            b"vault",
            signer_key.as_ref(),
            &[bump],
        ];
        let signer_seeds = &[&seeds[..]];

        let cpi_ctx = CpiContext::new_with_signer(
            self.token_program.to_account_info(),
            transfer_instruction,
            signer_seeds,
        );

        transfer(cpi_ctx, self.vault.amount)?;

        // Close the vault account and send the remaining rent to the signer
        let close_account_instruction = CloseAccount {
            account: self.vault.to_account_info(),
            destination: self.signer.to_account_info(),
            authority: self.token_account_owner_pda.to_account_info(),
        };

        let cpi_ctx_close = CpiContext::new_with_signer(
            self.token_program.to_account_info(),
            close_account_instruction,
            signer_seeds,
        );

        close_account(cpi_ctx_close)?;

        Ok(())
    }
}
