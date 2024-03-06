use std::{cell::RefCell, rc::Rc};

use candid::{Principal, Nat};
use ic_exports::{ic_cdk::{self, call}, icrc_types::icrc1::account::Subaccount};
use canister_sdk::{
   ic_canister::{
        init, post_upgrade, pre_upgrade, query, update, Canister, MethodType, PreUpdate 
    }, ic_helpers::tokens::Tokens128, ic_metrics::{Metrics, MetricsStorage}, ic_storage
};
use token::state::ledger::TxReceipt;

use crate::{icrc::{icrc1::Icrc1, icrc2::{Icrc2,Icrc2Token}}, state::{config::{SupportedToken, VaultConfig}, tx_record::TxRecordsData}};
use crate::state::ledger::VaultLedger;
use crate::error::VaultError;
use crate::record::{
    Deposit,
    Withdraw,
};
use ic_exports::icrc_types::icrc2::transfer_from::TransferFromArgs;
use ic_exports::icrc_types::icrc1::account::Account as Account;
use crate::exchange_rate:: {
    AssetClass,
    Asset,
    GetExchangeRateRequest,
    GetExchangeRateResult,
    Service,
};

const PERCENTAGE_DIVISOR: u16 = 10000;

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

    #[update]
    pub async fn get_aum(&self) -> f64 {
        VaultLedger::get_stable().get_aum().await
    }

    #[update]
    pub async fn get_nav(&self) -> f64 {
        VaultLedger::get_stable().get_nav().await
    }
    
    /// only the controller can set the token canister once
    /// just set the token canister once
    #[update]
    pub fn set_shares_token(&self, token: Principal) -> Result<(), VaultError> {
        let caller = ic_cdk::caller();
        let mut conf = VaultConfig::get_stable();
        if conf.owner != caller {
            return Err(VaultError::NotController);
        }
        if conf.shares_token.is_some() {
            return Err(VaultError::TokenAlreadySet);
        }
        conf.shares_token = Some(token);
        VaultConfig::set_stable(conf);
        Ok(())
    }

    #[update]
    pub async fn deposit(&self, deposit_args: Deposit) -> Result<f64, VaultError> {
        let caller_principal = canister_sdk::ic_kit::ic::caller();
        let canister_id = canister_sdk::ic_kit::ic::id();
        // check if token is supported
        let conf = VaultConfig::get_stable();
        let token_symbol = conf.supported_tokens.iter().find(|item| item.canister_id == deposit_args.canister_id).unwrap().symbol.clone();
        if token_symbol == "" {
            return Err(VaultError::TokenNotSupported);
        }
        ic_cdk::println!("depositing {} of {}", deposit_args.amount, token_symbol);
        let ledger_data = VaultLedger::get_stable();
        // transfer token (must approve first)
        let token_ins = Icrc2Token::new(deposit_args.canister_id);
        let token_fee = token_ins.icrc1_fee().await.unwrap().0;
        let token_decimals = token_ins.icrc1_decimals().await.unwrap().0;
        let transfer_result = token_ins.icrc2_transfer_from(TransferFromArgs {
            spender_subaccount: None,
            from: Account::from(caller_principal),
            to: Account::from(canister_id),
            amount: deposit_args.clone().amount,
            fee: Some(token_fee),
            memo: None,
            created_at_time: None,
        }).await.unwrap().0;
        if transfer_result.is_err() {
            return Err(VaultError::ICRC2TransferError(transfer_result.unwrap_err()));
        }
        ic_cdk::println!("transfer token ok!");
        // cacl nav
        let nav = ledger_data.get_nav().await;
        if nav == 0.0 {
            return Err(VaultError::ZeroNav)
        }
        // mint shares
        let exchange_rate_result = Service::new(VaultConfig::get_stable().exchange_rate_canister.clone()).get_exchange_rate(GetExchangeRateRequest{
            timestamp: None,
            quote_asset: Asset{
                class: AssetClass::Cryptocurrency,
                symbol: "USDT".to_string(),
            },
            base_asset: Asset{
                class: AssetClass::Cryptocurrency,
                symbol: token_symbol.clone(),
            },
        }).await.unwrap().0;
        match exchange_rate_result {
            GetExchangeRateResult::Ok(exchange_rate) => {
                ic_cdk::println!("exchange rate: {:?}", exchange_rate);
                let rate = exchange_rate.rate;
                let decimals = exchange_rate.metadata.decimals;
                let exchange_rate_human = (rate as f64) / (10u64.pow(decimals) as f64);
                let amount_u128 :u128 = deposit_args.amount.clone().0.try_into().unwrap();
                let amount = (amount_u128 as f64) / (10u64.pow(token_decimals.into()) as f64);
                let shares_num = exchange_rate_human * amount / nav;
                ic_cdk::println!("minting {} shares", shares_num);
                let tx_receipt = call::<(Principal, Option<Subaccount>, Tokens128), (TxReceipt,)>(
                    conf.shares_token.unwrap(),
                    "mint",
                    (caller_principal, None::<Subaccount>, Tokens128::from_f64(shares_num * (10u64.pow(8) as f64)).unwrap())
                ).await.unwrap().0;
                if tx_receipt.is_err() {
                    ic_cdk::println!("mint shares error: {:?}", tx_receipt.as_ref().unwrap_err());
                    return Err(VaultError::SharesTokenError(tx_receipt.unwrap_err()));
                }
                // update ledger
                let mut ledger_data = VaultLedger::get_stable();
                if ledger_data.tokens.is_none() {
                    ledger_data.tokens = Some(vec![]);
                }
                let token_new = SupportedToken {
                    canister_id: deposit_args.canister_id.clone(),
                    symbol: token_symbol,
                };
                if !ledger_data.tokens.as_ref().unwrap().contains(&token_new) {
                    ledger_data.tokens.as_mut().unwrap().push(token_new);
                }
                VaultLedger::set_stable(ledger_data);
                // add deposit record
                TxRecordsData::deposit(deposit_args);
                Ok(shares_num.clone())
            },
            GetExchangeRateResult::Err(err) => {
                ic_cdk::println!("get exchange rate error: {:?}", err);
                return Err(VaultError::ExchangeRateError);
            }
        }
    }

    #[update]
    pub async fn withdraw(&self, withdraw_args: Withdraw) -> Result<Vec<Nat>, VaultError> {
        let caller_principal = canister_sdk::ic_kit::ic::caller();
        let canister_id = canister_sdk::ic_kit::ic::id();
        if withdraw_args.canister_ids.len() != withdraw_args.weights.len() {
            return Err(VaultError::InvalidWithdrawArgs);
        }
        // get shares token balance
        let shares_token = VaultConfig::get_stable().shares_token.unwrap();
        let shares_token_ins = Icrc2Token::new(shares_token);   
        let shares_balance = shares_token_ins.icrc1_balance_of(Account::from(caller_principal)).await.unwrap().0;
        let shares_balance_u128: u128 = shares_balance.clone().0.try_into().unwrap();
        let withdraw_shares = (withdraw_args.shares_percent.clone() as f64) / (PERCENTAGE_DIVISOR as f64) * (shares_balance_u128 as f64);
        // get nav
        let nav = VaultLedger::get_stable().get_nav().await;
        // calculate withdraw amount
        let withdraw_amount = nav * withdraw_shares.clone();
        let mut withdraw_token_amount_vec = vec![];
        for (i,token_canister_id) in withdraw_args.canister_ids.iter().enumerate() {
            let token_ins = Icrc2Token::new(token_canister_id.clone());
            let token_decimals = token_ins.icrc1_decimals().await.unwrap().0;
            let token_balance = token_ins.icrc1_balance_of(Account::from(canister_id.clone())).await.unwrap().0;
            // get exchange rate
            let token_exchange_symbol = VaultConfig::get_stable().supported_tokens.iter().find(|item| item.canister_id == token_canister_id.clone()).unwrap().symbol.clone();
            let exchange_rate_result = Service::new(VaultConfig::get_stable().exchange_rate_canister.clone()).get_exchange_rate(GetExchangeRateRequest{
                timestamp: None,
                quote_asset: Asset{
                    class: AssetClass::Cryptocurrency,
                    symbol: "USDT".to_string(),
                },
                base_asset: Asset{
                    class: AssetClass::Cryptocurrency,
                    symbol: token_exchange_symbol,
                },
            }).await.unwrap().0;
            match exchange_rate_result {
                GetExchangeRateResult::Ok(exchange_rate) => {
                    let rate = exchange_rate.rate;
                    let decimals = exchange_rate.metadata.decimals;
                    let exchange_rate_human = (rate as f64) / (10u64.pow(decimals) as f64);
                    let withdraw_token_amount = Nat::from((withdraw_amount.clone() * (withdraw_args.weights[i].clone() as f64) / (PERCENTAGE_DIVISOR as f64) / exchange_rate_human * (10u64.pow(token_decimals.into()) as f64)) as u128);
                    if token_balance < withdraw_token_amount {
                        return Err(VaultError::InsufficientTokenBalance);
                    }
                    withdraw_token_amount_vec.push(withdraw_token_amount);
                },
                GetExchangeRateResult::Err(_) => {
                    ic_cdk::print("get exchange rate error");
                    return Err(VaultError::ExchangeRateError);
                }
            };
        };
        // burn shares
        let tx_receipt = call::<(Principal, Option<Subaccount>, Tokens128), (TxReceipt,)>(
            shares_token,
            "burn",
            (caller_principal, None::<Subaccount>,Tokens128::from_f64(withdraw_shares * (10u64.pow(8) as f64)).unwrap())
        ).await.unwrap().0;
        if tx_receipt.is_err() {
            return Err(VaultError::SharesTokenError(tx_receipt.unwrap_err()));
        }
        // transfer token
        for (i,token_canister_id) in withdraw_args.canister_ids.iter().enumerate() {
            let token_ins = Icrc2Token::new(token_canister_id.clone());
            let token_fee = token_ins.icrc1_fee().await.unwrap().0;
            let transfer_result = token_ins.icrc2_transfer_from(TransferFromArgs {
                spender_subaccount: None,
                from: Account::from(canister_id.clone()),
                to: Account::from(caller_principal.clone()),
                amount: withdraw_token_amount_vec[i].clone(),
                fee: Some(token_fee),
                memo: None,
                created_at_time: None,
            }).await.unwrap().0;
            if transfer_result.is_err() {
                return Err(VaultError::ICRC2TransferError(transfer_result.unwrap_err()));
            }
        }
        // add withdraw record
        TxRecordsData::withdraw(withdraw_args);
        Ok(withdraw_token_amount_vec)
    }
}