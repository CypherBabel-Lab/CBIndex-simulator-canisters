use std::{rc::Rc, cell::RefCell};

use candid::Principal;
use canister_sdk::{
    ic_canister::{
        Canister, PreUpdate, MethodType
    }, 
    ic_metrics::{MetricsStorage, Metrics}, ic_storage
};

#[derive(Clone, Canister)]
pub struct VaultFactoryCanister {
    #[id]
    principal: Principal,
}

impl Metrics for VaultFactoryCanister {
    fn metrics(&self) -> Rc<RefCell<MetricsStorage>> {
        <MetricsStorage as ic_storage::IcStorage>::get()
    }
}
impl PreUpdate for VaultFactoryCanister {
    fn pre_update(&self, _method_name: &str, _method_type: MethodType) {
        self.update_metrics();
    }
}