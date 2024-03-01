use candid::CandidType;
use token::error::TxError;
use thiserror::Error;
use ic_exports::icrc_types::icrc2:: transfer_from::TransferFromError;
#[derive(Debug, Error, CandidType)]
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

    #[error("Exchange Rate error")]
    ExchangeRateError,
}
