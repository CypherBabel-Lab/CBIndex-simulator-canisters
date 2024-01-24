pub mod error;
pub mod api;
pub mod icrc;
pub mod state;
pub use state::State;
pub use api::*;

#[cfg(feature = "export-api")]
#[no_mangle]
pub static VAULT_FACTORY_CANISTER_MARKER: &str = "VAULT_FACTORY_CANISTER";

pub fn idl() -> String {
    use crate::error::VaultFactoryError;
    use canister_sdk::{
        ic_canister::{generate_idl, Idl},
        ic_factory::{
            api::{FactoryCanister, UpgradeResult},
            error::FactoryError,
        },
    };
    use ic_exports::Principal;
    use std::collections::HashMap;
    use crate::icrc::*;

    let canister_idl = generate_idl!();
    let mut factory_idl = <VaultFactoryCanister as FactoryCanister>::get_idl();
    factory_idl.merge(&canister_idl);

    candid::bindings::candid::compile(&factory_idl.env.env, &Some(factory_idl.actor))
}