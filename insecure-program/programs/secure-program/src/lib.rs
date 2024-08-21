use anchor_lang::prelude::*;

declare_id!("DWtFFpfQvjGPCbZkKe6bMniL3G9Lmp5dtZb6adWjhevA");

#[program]
pub mod secure_program {
    use super::*;

    pub fn initialize(ctx: Context<CreateUser>, id: u32, name: String) -> Result<()> {
        let user = &mut ctx.accounts.user;

        require!(
            user.owner == *ctx.accounts.signer.key,
            MyError::Unauthorized
        );

        user.id = id;
        user.owner = *ctx.accounts.signer.key;
        user.name = name;
        user.points = 1000;

        msg!("Created new user with 1000 points and id: {}", id);

        Ok(())
    }

    pub fn transfer_points(ctx: Context<TransferPoints>, amount: u16) -> Result<()> {
        require!(
            ctx.accounts.sender.points >= amount,
            MyError::NotEnoughPoints
        );

        ctx.accounts.sender.points -= amount;
        ctx.accounts.receiver.points += amount;

        msg!("Transferred {} points", amount);

        Ok(())
    }

    pub fn remove_user(ctx: Context<RemoveUser>) -> Result<()> {
        let user = &ctx.accounts.user;

        msg!("Account closed for user with id: {}", user.id);

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(id: u32)]
pub struct CreateUser<'info> {
    #[account(
        init,
        payer = signer,
        space = 8 + 4 + 32 + (4 + 10) + 2,
        seeds = [b"user", signer.key.as_ref(), id.to_le_bytes().as_ref()], 
        bump
    )]
    pub user: Account<'info, User>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(id_sender: u32, id_receiver: u32)]
pub struct TransferPoints<'info> {
    #[account(
        mut,
        seeds = [b"user", sender.key().as_ref()], 
        bump,
        has_one = owner
    )]
    pub sender: Account<'info, User>,
    #[account(
        mut,
        seeds = [b"user", receiver.key().as_ref()], 
        bump
    )]
    pub receiver: Account<'info, User>,
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(id: u32)]
pub struct RemoveUser<'info> {
    #[account(
        mut,
        seeds = [b"user", id.to_le_bytes().as_ref()], 
        bump,
        close = signer
    )]
    pub user: Account<'info, User>,
    pub signer: Signer<'info>,
}

#[account]
#[derive(Default)]
pub struct User {
    pub id: u32,
    pub owner: Pubkey,
    pub name: String,
    pub points: u16,
}

#[error_code]
pub enum MyError {
    #[msg("Not enough points to transfer")]
    NotEnoughPoints,
    #[msg("Unauthorized")]
    Unauthorized,
}
