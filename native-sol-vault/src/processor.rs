use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{account_info::AccountInfo, entrypoint::ProgramResult, pubkey::Pubkey};

use crate::instructions::deposit;
use crate::instructions::withdraw;

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub enum TransferInstruction {
    DepositInstruction(u64),
    WithdrawalInstruction(),
}

pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    input: &[u8],
) -> ProgramResult {
    let instruction = TransferInstruction::try_from_slice(input)?;
    match instruction {
        TransferInstruction::DepositInstruction(args) => deposit(program_id, accounts, args),
        TransferInstruction::WithdrawalInstruction() => withdraw(program_id, accounts),
    }
}
