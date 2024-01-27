use std::cell::RefCell;
use std::collections::HashMap;
use std::rc::Rc;

use crate::{error::VaultFactoryError, state};
use candid::{Principal, Nat};
use canister_sdk::ic_factory::DEFAULT_ICP_FEE;
use canister_sdk::ic_helpers::tokens::Tokens128;
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
use ic_exports::{ic_cdk, ledger};
use ic_exports::icrc_types::icrc2::allowance::AllowanceArgs;
use ic_exports::icrc_types::icrc2::transfer_from::TransferFromArgs;
use ic_exports::icrc_types::icrc1::account::Account as Account;
use token::state::config::Metadata;
use vault::state::config::VaultConfig;
use vault::icrc:: icrc1:: Icrc1;
use vault::icrc:: icrc2::{ Icrc2, Icrc2Token};
use vault::icrc:: utils::principal_to_subaccount;
use crate::state::{PrincipalValue, VaultFactoryConfig};

const DEFAULT_LEDGER_PRINCIPAL: Principal = Principal::from_slice(&[0, 0, 0, 0, 0, 0, 0, 2, 1, 1]);
const DEFAULT_EXCHANGE_RATE_CANISTER: Principal = Principal::from_slice(&[0, 0, 0, 0, 0, 0, 0, 2, 1, 2]);
const VAULT_WASM: &[u8] = include_bytes!("../../../target/wasm32-unknown-unknown/release/vault.wasm");
const TOKEN_WASM: &[u8] = include_bytes!("../../../target/wasm32-unknown-unknown/release/token.wasm");

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
        state::get_state().set_vault_factory_controller(controller);
    }

    #[query]
    pub fn get_config(&self) -> VaultFactoryConfig {
        state::get_state().gey_vault_factory_config()
    }

    /// Returns the vault, or None if it does not exist.
    #[query]
    pub async fn get_vault(&self, name: String) -> Option<PrincipalValue> {
        state::get_state().get_vault(name)
    }

    #[query]
    pub fn get_vaults(&self) -> Vec<PrincipalValue> {
        state::get_state().get_vaults()
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
        info: Metadata,
        supported_tokens: Vec<Principal>,
        exchange_rate_canister: Option<Principal>,
        controller: Option<Principal>,
    ) -> Result<PrincipalValue, VaultFactoryError> {
        if info.name.is_empty() {
            return Err(VaultFactoryError::InvalidConfiguration(
                "name",
                "cannot be `None`",
            ));
        }

        if info.name.as_bytes().len() > 1024 {
            return Err(VaultFactoryError::InvalidConfiguration(
                "name",
                "should be less then 1024 bytes",
            ));
        }

        if info.symbol.is_empty() {
            return Err(VaultFactoryError::InvalidConfiguration(
                "symbol",
                "cannot be `None`",
            ));
        }

        let key = info.name.clone();
        if state::get_state().get_vault(key.clone()).is_some() {
            return Err(VaultFactoryError::AlreadyExists);
        }

        let caller_principal = canister_sdk::ic_kit::ic::caller();
        let vault_config = VaultConfig {
            owner: caller_principal.clone(),
            exchange_rate_canister: exchange_rate_canister.unwrap_or(DEFAULT_EXCHANGE_RATE_CANISTER),
            name: info.name.clone(),
            symbol: info.symbol.clone(),
            supported_tokens,
            deploy_time: time(),
            shares_token: None,
        };
        self.set_canister_wasm(VAULT_WASM.to_vec())?;
        let vault_principal = self
            .create_canister((vault_config,), controller, Some(caller_principal.clone()))
            .await?;
        self.set_canister_wasm(TOKEN_WASM.to_vec())?;
        let mut info = info.clone();
        info.owner = caller_principal;
        info.decimals = 8;
        info.fee = Tokens128::from(10000);
        info.fee_to = caller_principal;
        info.is_test_token = Some(false);
        let shares_token_principal = self
            .create_canister((info, Nat::from(0)), controller, Some(caller_principal.clone()))
            .await?;
        let principal_value = PrincipalValue::new(vault_principal, shares_token_principal);
        state::get_state().insert_vault(key, principal_value.clone());
        Ok(principal_value)
    }

    fn set_canister_wasm(&self, wasm: Vec<u8>) -> Result<(), VaultFactoryError> {
        let _ = FactoryState::default().check_is_owner_internal(state::get_state().get_vault_factory_controller())?.set_canister_wasm(wasm);
        Ok(())
    }

    #[update]
    pub async fn transfer_icp(&self) -> Result<(), VaultFactoryError> {
        let caller_principal = canister_sdk::ic_kit::ic::caller();
        let canister_id = canister_sdk::ic_kit::ic::id();

        let icp_token = Icrc2Token::new(DEFAULT_LEDGER_PRINCIPAL);

        let icp_allowance = icp_token.icrc2_allowance(AllowanceArgs {
            account: Account::from(caller_principal),
            spender: Account::from(canister_id),
        }).await.unwrap().0;
        // if icp_allowance.allowance < DEFAULT_ICP_FEE {
        //     return Err(VaultFactoryError::InvalidIcpAllowance);
        // }
        let transfer_result = icp_token.icrc2_transfer_from(TransferFromArgs {
            spender_subaccount: None,
            from: Account::from(caller_principal),
            to: Account {
                owner: canister_id,
                subaccount: Some(principal_to_subaccount(&caller_principal)),
            },
            amount: icp_allowance.allowance - Nat::from(ledger::DEFAULT_TRANSFER_FEE.get_e8s()),
            fee : Some(Nat::from(ledger::DEFAULT_TRANSFER_FEE.get_e8s())),
            memo: None,
            created_at_time: None,
        }).await.unwrap().0;
        if transfer_result.is_err() {
            return Err(VaultFactoryError::TxError(transfer_result.unwrap_err()));
        }
        let balance = icp_token.icrc1_balance_of(Account {
            owner: canister_id,
            subaccount: Some(principal_to_subaccount(&caller_principal)),
        }).await.unwrap().0;
        ic_cdk::println!("balance: {:?}", balance);
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
