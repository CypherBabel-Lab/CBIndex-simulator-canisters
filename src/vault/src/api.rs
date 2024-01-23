use std::{rc::Rc, cell::RefCell};

use candid::Nat;
use ic_exports::{candid::Principal, ic_cdk};
use canister_sdk::{
    ic_canister::{
        init,query,update,pre_upgrade,post_upgrade,Canister, PreUpdate, MethodType, 
    }, 
    ic_metrics::{MetricsStorage, Metrics}, ic_storage
};

use crate::state::config::VaultConfig;
use crate::state::ledger::VaultLedger;
use crate::error::VaultError;

// #[cfg(feature = "export-api")]
// use canister_sdk::{ic_cdk, ic_cdk_macros::inspect_message};

#[derive(Clone, Canister)]
#[canister_no_upgrade_methods]
pub struct VaultCanister {
    #[id]
    principal: Principal,
}

impl Metrics for VaultCanister {
    fn metrics(&self) -> Rc<RefCell<MetricsStorage>> {
        <MetricsStorage as ic_storage::IcStorage>::get()
    }
}
impl PreUpdate for VaultCanister {
    fn pre_update(&self, _method_name: &str, _method_type: MethodType) {
        self.update_metrics();
    }
}

#[allow(dead_code)]
impl VaultCanister {
    #[query]
    fn pkg_version(&self) -> &'static str {
        option_env!("CARGO_PKG_VERSION").unwrap_or("NOT_FOUND")
    }

    #[pre_upgrade]
    fn pre_upgrade(&self) {
        // All state is stored in stable storage, so nothing to do here
    }

    #[post_upgrade]
    fn post_upgrade(&self) {
        // All state is stored in stable storage, so nothing to do here
    }

    #[init]
    pub fn init(&self, info: VaultConfig) {
        // All state is stored in stable storage, so nothing to do here
        ic_cdk::println!("initializing vault");
        VaultConfig::set_stable(info);
    }

    #[query]
    pub fn get_config(&self) -> VaultConfig {
        VaultConfig::get_stable()
    }

    #[query]
    pub fn get_ledger(&self) -> VaultLedger {
        VaultLedger::get_stable()
    }

    #[query]
    pub async fn get_aum(&self) -> Nat {
        VaultLedger::get_stable().get_aum().await
    }

    #[query]
    pub async fn get_nav(&self) -> Nat {
        VaultLedger::get_stable().get_nav().await
    }

    #[update]
    pub fn deposit(&self, token: Principal, amount: u64) -> Result<(), VaultError> {
        println!("depositing {} of {}", amount, token);
        Ok(())
    }
}