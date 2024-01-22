use candid::CandidType;
use token::error::TxError;
use thiserror::Error;

#[derive(Debug, Error, CandidType)]
pub enum VaultError {
    #[error("the property {0} has invalid value: {0}")]
    InvalidConfiguration(&'static str, &'static str),

    #[error("token not supported")]
    AssetNotSupported,

    #[error(transparent)]
    SharesTokenError(#[from] TxError),
}
