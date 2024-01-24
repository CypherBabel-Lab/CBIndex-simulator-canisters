//! Module     : factory
//! Copyright  : 2022 InfinitySwap Team
//! Stability  : Experimental

use std::cell::RefCell;
use std::collections::HashMap;
use std::rc::Rc;

use crate::{error::VaultFactoryError, state};
use candid::Principal;
use canister_sdk::ic_factory::DEFAULT_ICP_FEE;
use canister_sdk::ic_metrics::{Metrics, MetricsStorage};
use canister_sdk::{
    ic_canister::{
        init, post_upgrade, pre_upgrade, query, update, Canister, MethodType, PreUpdate,
    },
    ic_factory::{
        api::{FactoryCanister, UpgradeResult},
        error::FactoryError,
        FactoryConfiguration, FactoryState,
    },
    ic_storage,
    ic_exports::ic_cdk::api::time,
};
use crate::icrc::*;
use vault::state::config::VaultConfig;
// use vault::state::config::VaultConfig;

const DEFAULT_LEDGER_PRINCIPAL: Principal = Principal::from_slice(&[0, 0, 0, 0, 0, 0, 0, 2, 1, 1]);
const DEFAULT_EXCHANGE_RATE_CANISTER: Principal = Principal::from_slice(&[0, 0, 0, 0, 0, 0, 0, 2, 1, 2]);
const VAULT_WASM: &[u8] = include_bytes!("../../../target/wasm32-unknown-unknown/release/vault.wasm");
const TOKEN_WASM: &[u8] = include_bytes!("../../icrc/icrc1_ledger.wasm");

#[derive(Clone, Canister)]
#[canister_no_upgrade_methods]
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

#[allow(dead_code)]
impl VaultFactoryCanister {
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
    pub fn init(&self, controller: Principal, ledger_principal: Option<Principal>) {
        let ledger = ledger_principal.unwrap_or(DEFAULT_LEDGER_PRINCIPAL);

        let factory_configuration =
            FactoryConfiguration::new(ledger, DEFAULT_ICP_FEE, controller, controller);

        FactoryState::default().reset(factory_configuration);
        state::get_state().reset();
    }

    /// Returns the vault, or None if it does not exist.
    #[query]
    pub async fn get_vault(&self, name: String) -> Option<Principal> {
        state::get_state().get_vault(name)
    }

    #[query]
    pub fn get_vaults(&self) -> Vec<Principal> {
        state::get_state().get_vaults()
    }

    #[update]
    pub async fn set_vault_bytecode(&self) -> Result<u32, FactoryError> {
        state::get_state().set_vault_wasm(Some(VAULT_WASM.to_vec()));
        self.set_canister_code(VAULT_WASM.to_vec())
    }

    #[update]
    pub async fn set_token_bytecode(&self) -> Result<u32, FactoryError> {
        state::get_state().set_token_wasm(Some(TOKEN_WASM.to_vec()));
        self.set_canister_code(TOKEN_WASM.to_vec())
    }

    /// Creates a new vault.
    ///
    /// Creating a vault canister with the factory requires one of the following:
    /// * the call must be made through a cycles wallet with enough cycles to cover the canister
    ///   expenses. The amount of provided cycles must be greater than `10^12`. Most of the cycles
    ///   will be added to the newly created canister balance, while some will be consumed by the
    ///   factory
    /// * the caller must transfer some amount of ICP to their subaccount into the ICP ledger factory account.
    ///   The subaccount id can be calculated like this:
    ///
    /// ```ignore
    /// let mut subaccount = [0u8; 32];
    /// let principal_id = caller_id.as_slice();
    /// subaccount[0] = principal_id.len().try_into().unwrap();
    /// subaccount[1..1 + principal_id.len()].copy_from_slice(principal_id);
    /// ```
    ///
    /// The amount of provided ICP must be greater than the `icp_fee` factory property. This value
    /// can be obtained by the `get_icp_fee` query method. The ICP fees are transferred to the
    /// principal designated by the factory controller. The canister is then created with some
    /// minimum amount of cycles.
    ///
    /// If the provided ICP amount is greater than required by the factory, extra ICP will not be
    /// consumed and can be used to create more canisters, or can be reclaimed by calling `refund_icp`
    /// method.
    #[update]
    pub async fn create_vault(
        &self,
        info: InitArgs,
        supported_tokens: Vec<Principal>,
        exchange_rate_canister: Option<Principal>,
        controller: Option<Principal>,
    ) -> Result<Principal, VaultFactoryError> {
        if info.token_name.is_empty() {
            return Err(VaultFactoryError::InvalidConfiguration(
                "name",
                "cannot be `None`",
            ));
        }

        if info.token_name.as_bytes().len() > 1024 {
            return Err(VaultFactoryError::InvalidConfiguration(
                "name",
                "should be less then 1024 bytes",
            ));
        }

        if info.token_symbol.is_empty() {
            return Err(VaultFactoryError::InvalidConfiguration(
                "symbol",
                "cannot be `None`",
            ));
        }

        let key = info.token_name.clone();
        if state::get_state().get_vault(key.clone()).is_some() {
            return Err(VaultFactoryError::AlreadyExists);
        }

        let caller = canister_sdk::ic_kit::ic::caller();
        let mut info2 = info.clone();
        // set to icrc2
        info2.feature_flags = Some(FeatureFlags {
            icrc2: true,
        });
        self.set_canister_code(TOKEN_WASM.to_vec())?;
        let shares_token_principal = self
            .create_canister((info2,), controller, Some(caller))
            .await?;
        let vault_config = VaultConfig {
            owner: caller,
            exchange_rate_canister: exchange_rate_canister.unwrap_or(DEFAULT_EXCHANGE_RATE_CANISTER),
            shares_token: shares_token_principal,
            name: info.token_name,
            symbol: info.token_symbol,
            supported_tokens,
            deploy_time: time(),
        };
        self.set_canister_code(VAULT_WASM.to_vec())?;
        let vault_principal = self
            .create_canister((vault_config,), controller, Some(caller))
            .await?;
        state::get_state().insert_vault(key, vault_principal);

        Ok(vault_principal)
    }

    #[update]
    pub async fn forget_vault(&self, name: String) -> Result<(), VaultFactoryError> {
        let canister_id = self
            .get_vault(name.clone())
            .await
            .ok_or(VaultFactoryError::FactoryError(FactoryError::NotFound))?;

        self.drop_canister(canister_id, None).await?;
        state::get_state().remove_vault(name);

        Ok(())
    }

    #[update]
    pub async fn upgrade(&mut self) -> Result<HashMap<Principal, UpgradeResult>, FactoryError> {
        self.upgrade_canister().await
    }
}

impl FactoryCanister for VaultFactoryCanister {}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn ledger_principal() {
        const LEDGER: &str = "ryjl3-tyaaa-aaaaa-aaaba-cai";
        let original_principal = Principal::from_text(LEDGER).unwrap();
        assert_eq!(DEFAULT_LEDGER_PRINCIPAL, original_principal);
    }
}
