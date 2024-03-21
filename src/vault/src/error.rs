use candid::{CandidType, Deserialize};
use token::error::TxError;
use thiserror::Error;
use ic_exports::icrc_types::icrc2::{approve::ApproveError,  transfer_from::TransferFromError};

use crate::icp_swap::swap_pool;

#[derive(Debug, Error, CandidType, Deserialize)]
pub enum VaultError {
    #[error("the property {0} has invalid value: {0}")]
    InvalidConfiguration(&'static str, &'static str),

    #[error("not controller")]
    NotController,

    #[error("token not supported")]
    AssetNotSupported,

    #[error("token already set")]
    TokenAlreadySet,

    #[error("token not supported")]
    TokenNotSupported,

    #[error("nav is zero")]
    ZeroNav,

    #[error(transparent)]
    SharesTokenError(#[from] TxError),

    #[error("ICRC2 transfer error")]
    ICRC2TransferError(TransferFromError),

    #[error("ICRC2 approve error")]
    ICRC2ApproveError(ApproveError),

    #[error("Exchange Rate error")]
    ExchangeRateError,
    
    #[error("Invalid withdraw args")]
    InvalidWithdrawArgs,

    #[error("Insufficient token balance")]
    InsufficientTokenBalance,

    #[error("Invalid token allowance")]
    InvalidTokenAllowance,

    #[error("Swap pool error")]
    SwapPoolError(swap_pool::Error),

    #[error("already followed")]
    AlreadyFollowed,

    #[error("not followed")]
    NotFollowed
}
