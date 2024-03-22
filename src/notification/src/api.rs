use std::cell::RefCell;
use std::rc::Rc;

use crate::{error::NotificationError, state::{controller::Controller, notification_record::{NotificationRecordsData, PaginatedResult, TxId}, whitelist::Whitelist}};
use candid::Principal;
use canister_sdk::ic_metrics::{Metrics, MetricsStorage};
use canister_sdk::{
    ic_canister::{
        init, post_upgrade, pre_upgrade, query, update, Canister, MethodType, PreUpdate,
    },
    ic_storage,
};
use ic_exports::ic_cdk;
use vault::record;

#[derive(Clone, Canister)]
#[canister_no_upgrade_methods]
pub struct NotificationCanister {
    #[id]
    principal: Principal,
}

impl Metrics for NotificationCanister {
    fn metrics(&self) -> Rc<RefCell<MetricsStorage>> {
        <MetricsStorage as ic_storage::IcStorage>::get()
    }
}
impl PreUpdate for NotificationCanister {
    fn pre_update(&self, _method_name: &str, _method_type: MethodType) {
        self.update_metrics();
    }
}

#[allow(dead_code)]
impl NotificationCanister {
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
    pub fn init(&self, controller: Principal) {
        Controller::set_stable(Controller(controller));
    }

    #[query]
    fn get_records(&self, count:usize, id:Option<TxId>) -> PaginatedResult {
        let caller = ic_cdk::caller();
        NotificationRecordsData::get_records(caller, count, id)
    }

    #[update]
    fn add_whitelist(&self, principal: Principal) -> Result<(), NotificationError> {
        let caller = ic_cdk::caller();
        if !Controller::check(caller) {
            return Err(NotificationError::NotController);
        }
        if Whitelist::get_stable().data.is_some() {
            let whitelist = Whitelist::get_stable();
            if whitelist.data.clone().unwrap().contains(&principal) {
                return Ok(());
            }
            whitelist.data.clone().unwrap().push(principal);
            Whitelist::set_stable(whitelist);
        } else {
            let data = vec![principal];
            Whitelist::set_stable(Whitelist { data: Some(data) });
        }
        Ok(())
    }

    #[update]
    fn add_notification_followed(&self, key:Principal, user: Principal) -> Result<(), NotificationError> {
        let caller = ic_cdk::caller();
        self.check_whitelist(caller)?;
        NotificationRecordsData::followed(key, user,caller);
        Ok(())
    }

    #[update]
    fn add_notification_unfollowed(&self, key:Principal, user: Principal) -> Result<(), NotificationError> {
        let caller = ic_cdk::caller();
        self.check_whitelist(caller)?;
        NotificationRecordsData::unfollowed(key, user,caller);
        Ok(())
    }

    #[update]
    fn add_notification_deposit(&self, users: Vec<Principal>, record: record::Deposit) -> Result<(), NotificationError> {
        let caller = ic_cdk::caller();
        self.check_whitelist(caller)?;
        for user in users {
            NotificationRecordsData::deposit(user, caller, record.clone());
        }
        Ok(())
    }

    #[update]
    fn add_notification_withdraw(&self, users: Vec<Principal>, record: record::Withdraw) -> Result<(), NotificationError> {
        let caller = ic_cdk::caller();
        self.check_whitelist(caller)?;
        for user in users {
            NotificationRecordsData::withdraw(user, caller, record.clone());
        }
        Ok(())
    }

    #[update]
    fn add_notification_swap(&self, users: Vec<Principal>, record: record::Swap) -> Result<(), NotificationError> {
        let caller = ic_cdk::caller();
        self.check_whitelist(caller)?;
        for user in users {
            NotificationRecordsData::swap(user, caller, record.clone());
        }
        Ok(())
    }

    fn check_whitelist(&self, principal: Principal) -> Result<(), NotificationError> {
        if let Some(whitelist) = Whitelist::get_stable().data {
            if !whitelist.contains(&principal) {
                return Err(NotificationError::NotWhitelist);
            }
        }else {
            return Err(NotificationError::NotWhitelist);
        }
        Ok(())
    }

}
