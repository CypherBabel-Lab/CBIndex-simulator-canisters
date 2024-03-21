pub mod error;
pub mod api;
pub mod state;
pub use api::*;
use canister_sdk::ic_metrics::Metrics;

#[cfg(feature = "export-api")]
#[no_mangle]
pub static NOTIFICATION_CANISTER_MARKER: &str = "NOTIFICATION_CANISTER";

pub fn idl() -> String {
    use crate::error::NotificationError;
    use canister_sdk::ic_canister::{generate_idl, Idl};
    use ic_exports::Principal;
    use crate::state::notification_record::{PaginatedResult, TxId};
    use vault::record;
    let canister_idl = generate_idl!();
    let mut factory_idl = <NotificationCanister>::get_idl();
    factory_idl.merge(&canister_idl);

    candid::bindings::candid::compile(&factory_idl.env.env, &Some(factory_idl.actor))
}