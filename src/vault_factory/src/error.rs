use candid::CandidType;
use canister_sdk::ic_factory::error::FactoryError;
use ic_exports::icrc_types::icrc2::transfer_from::TransferFromError;
use thiserror::Error;

#[derive(Debug, Error, CandidType)]
pub enum VaultFactoryError {
    #[error("the property {0} has invalid value: {0}")]
    InvalidConfiguration(&'static str, &'static str),

    #[error("not enough ICP allowance")]
    InvalidIcpAllowance,

    #[error("a vault with the same name is already registered")]
    AlreadyExists,

    #[error(transparent)]
    FactoryError(#[from] FactoryError),

    #[error("tx error when transferring ICP")]
    TxError(TransferFromError),
}
