use candid::CandidType;
use token::error::TxError;
use thiserror::Error;

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

    #[error(transparent)]
    SharesTokenError(#[from] TxError),
}
