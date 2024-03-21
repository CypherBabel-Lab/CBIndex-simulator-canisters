use candid::CandidType;
use thiserror::Error;

#[derive(Debug, Error, CandidType)]
pub enum NotificationError {
    #[error("not whitelist")]
    NotWhitelist,

    #[error("not controller")]
    NotController,
}
