pub mod api;
pub mod state;
pub mod exchange_rate;
pub mod error;
pub mod icrc;
pub mod record;
use candid::Nat;
pub use ic_exports::icrc_types::icrc1::account::Account as Account;
pub use ic_exports::icrc_types::icrc1::account::Subaccount as Subaccount;
pub use ic_exports::icrc1_ledger::Ledger;

pub use self::api::*;

/// This is a marker added to the wasm to distinguish it from other canisters
#[cfg(feature = "export-api")]
#[no_mangle]
pub static CBI_VAULT_CANISTER_MARKER: &str = "CBI_VAULT_CANISTER";

pub fn idl() -> String {
    use canister_sdk::ic_canister::{generate_idl,Idl};
    use ic_exports::Principal;
    use self::state::{
        ledger::VaultLedger,
        config::VaultConfig
    };
    use self::error::VaultError;
    use self::record::{Withdraw,Deposit};
    
    let canister_idl = generate_idl!();

    candid::bindings::candid::compile(&canister_idl.env.env, &Some(canister_idl.actor))
}