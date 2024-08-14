use anchor_lang::prelude::*;
use anchor_spl::token::Token;

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
      init_if_needed,
        payer = signer,
        seeds = [b"vault", signer.key().as_ref()],
        space = 8,
        bump,
    )]
    /// CHECK: Struct field "token_account_owner_pda" is unsafe, but is not documented.
    pub token_account_owner_pda: AccountInfo<'info>,

    #[account(mut)]
    pub signer: Signer<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}
