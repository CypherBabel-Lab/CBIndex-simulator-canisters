use std::{cell::RefCell, rc::Rc, str::FromStr};

use candid::{ Nat, Principal};
use ic_exports::{ic_cdk::{self, call}, icrc_types::{icrc1::account::Subaccount, icrc2::{allowance::AllowanceArgs, approve::ApproveArgs}}};
use canister_sdk::{
   ic_canister::{
        init, post_upgrade, pre_upgrade, query, update, Canister, MethodType, PreUpdate 
    }, ic_helpers::tokens::Tokens128, ic_metrics::{Metrics, MetricsStorage}, ic_storage
};
use token::{state::ledger::TxReceipt, tx_record::TxId};

use crate::{icp_swap::swap_pool,
    icrc::{icrc1::Icrc1, icrc2::{Icrc2,Icrc2Token}},
    state::{
        config::{SupportedToken, VaultConfig}, follow::Followed, ledger::{VaultLedgerTokenAum, VaultLedgerTokensAum}, tx_record::{PaginatedResult, TxRecordsData}
    }};
use crate::state::ledger::VaultLedger;
use crate::error::VaultError;
use crate::record::{
    Deposit,
    Withdraw,
    Swap,
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

use crate::notification;

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

    #[query]
    pub fn get_tx_records(&self, count:usize, id:Option<TxId>) -> PaginatedResult {
        TxRecordsData::get_records(count, id)
    }

    #[query]
    pub fn if_followed(&self) -> bool {
        let caller = ic_cdk::caller();
        let ledger_data = Followed::get_stable();
        if ledger_data.data.is_none() {
            return false;
        }
        ledger_data.data.as_ref().unwrap().contains(&caller)
    }

    #[query]
    pub fn get_followed(&self) -> Vec<Principal> {
        let ledger_data = Followed::get_stable();
        if ledger_data.data.is_none() {
            return vec![];
        }
        ledger_data.data.as_ref().unwrap().clone()
    }

    #[update]
    pub async fn get_aum(&self) -> VaultLedgerTokensAum {
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
    pub async fn deposit(&self, token_id: Principal, token_amount: Nat) -> Result<f64, VaultError> {
        let caller_principal = canister_sdk::ic_kit::ic::caller();
        let canister_id = canister_sdk::ic_kit::ic::id();
        // check if token is supported
        let conf = VaultConfig::get_stable();
        let token_symbol = conf.supported_tokens.iter().find(|item| item.canister_id == token_id).unwrap().symbol.clone();
        if token_symbol == "" {
            return Err(VaultError::TokenNotSupported);
        }
        ic_cdk::println!("depositing {} of {}", token_amount.clone(), token_symbol);
        let ledger_data = VaultLedger::get_stable();
        // transfer token (must approve first)
        let token_ins = Icrc2Token::new(token_id);
        let token_fee = token_ins.icrc1_fee().await.unwrap().0;
        let token_decimals = token_ins.icrc1_decimals().await.unwrap().0;
        let token_allowance = token_ins.icrc2_allowance(AllowanceArgs {
            account: Account::from(caller_principal),
            spender: Account::from(canister_id),
        }).await.unwrap().0;
        ic_cdk::println!("token allowance: {:?}", token_allowance);
        if token_allowance.allowance < token_amount.clone() + token_fee.clone() {
            return Err(VaultError::InvalidTokenAllowance);
        }
        let transfer_result = token_ins.icrc2_transfer_from(TransferFromArgs {
            spender_subaccount: None,
            from: Account::from(caller_principal),
            to: Account::from(canister_id),
            amount: token_amount.clone(),
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
        let exchange_rate_human = self.get_exchange_rate(token_symbol.clone()).await?;
        let amount_u128 :u128 = token_amount.clone().0.try_into().unwrap();
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
        let token_new = SupportedToken {
            canister_id: token_id.clone(),
            symbol: token_symbol,
        };
        self.add_ledger_token(token_new);
        // add deposit record
        let deposit_record = Deposit{
            operator: caller_principal,
            canister_id: token_id,
            amount,
            shares_num,
            eq_usd: exchange_rate_human * amount,
        };
        TxRecordsData::deposit(deposit_record.clone());
        // add notification
        let followed_data = Followed::get_stable();
        if followed_data.data.is_some() {
            notification::Service(conf.notification_canister.clone()).add_notification_deposit(followed_data.data.unwrap(), deposit_record).await.unwrap().0;
        }
        Ok(shares_num.clone())
    }

    #[update]
    pub async fn withdraw(&self, shares_percent: u16) -> Result<Withdraw, VaultError> {
        let caller_principal = canister_sdk::ic_kit::ic::caller();
        let canister_id = canister_sdk::ic_kit::ic::id();
        ic_cdk::println!("withdrawing {}% shares", shares_percent as f64 / (PERCENTAGE_DIVISOR as f64) * 100.0);
        // get shares token balance
        let shares_token = VaultConfig::get_stable().shares_token.unwrap();
        let shares_token_ins = Icrc2Token::new(shares_token);   
        let shares_balance = shares_token_ins.icrc1_balance_of(Account::from(caller_principal)).await.unwrap().0;
        ic_cdk::println!("shares balance: {:?}", shares_balance);
        let shares_balance_u128: u128 = shares_balance.clone().0.try_into().unwrap();
        let withdraw_shares = (shares_percent as f64) / (PERCENTAGE_DIVISOR as f64) * (shares_balance_u128 as f64) / 10u64.pow(8) as f64;
        let mut token_aum_vec = vec![];
        for support_token in VaultLedger::get_stable().tokens.unwrap().iter() {
            let token_ins = Icrc2Token::new(support_token.canister_id.clone());
            let token_decimals = token_ins.icrc1_decimals().await.unwrap().0;
            let token_balance = token_ins.icrc1_balance_of(Account::from(canister_id.clone())).await.unwrap().0;
            // get exchange rate
            let exchange_rate_human = self.get_exchange_rate(support_token.symbol.clone()).await?;
            let token_balance_u128: u128 = token_balance.clone().0.try_into().unwrap();
            let token_balance_amount = token_balance_u128 as f64 / (10u64.pow(token_decimals.into()) as f64);
            let token_aum = exchange_rate_human * token_balance_amount;
            token_aum_vec.push(VaultLedgerTokenAum{
                token_id: support_token.canister_id.clone(),
                balance: token_balance_amount,
                price: exchange_rate_human,
                aum: token_aum,
                decimals: token_decimals,
            });

        };
        // calculate withdraw amount
        let aum = token_aum_vec.iter().fold(0.0, |acc, x| acc + x.aum);
        let total_shares = shares_balance_u128 as f64 / 10u64.pow(8) as f64;
        let nav = aum / total_shares;
        ic_cdk::println!("nav: {:?}", nav);
        let mut withdraw_amount = nav * withdraw_shares;
        // sort by aum desc
        token_aum_vec.sort_by(|a, b| b.aum.partial_cmp(&a.aum).unwrap());
        let mut withdraw_token_amount_vec = vec![];
        let mut withdraw_canister_ids = vec![];
        let mut withdraw_res = Withdraw{
            operator: caller_principal,
            shares_nums: withdraw_shares,
            canister_ids: vec![],
            amounts: vec![],
            eq_usds: vec![],
        };
        for token_aum in token_aum_vec {
            withdraw_canister_ids.push(token_aum.token_id);
            withdraw_res.canister_ids.push(token_aum.token_id);
            if withdraw_amount <= token_aum.aum {
                withdraw_res.amounts.push(withdraw_amount/ token_aum.price);
                withdraw_res.eq_usds.push(withdraw_amount);
                withdraw_token_amount_vec.push(Nat::from((withdraw_amount / token_aum.price * 10u64.pow(token_aum.decimals.into()) as f64 ) as u128));
                break;
            }else {
                withdraw_amount -= token_aum.aum;
                withdraw_res.amounts.push(token_aum.balance);
                withdraw_res.eq_usds.push(token_aum.aum);
                withdraw_token_amount_vec.push(Nat::from((token_aum.balance * 10u64.pow(token_aum.decimals.into()) as f64) as u128));
            }
        }
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
        for (i,token_canister_id) in withdraw_canister_ids.iter().enumerate() {
            ic_cdk::println!("transfering {} of {}", withdraw_token_amount_vec[i].clone(), token_canister_id);
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
        TxRecordsData::withdraw(withdraw_res.clone());
        // add notification
        let followed_data = Followed::get_stable();
        if followed_data.data.is_some() {
            notification::Service(VaultConfig::get_stable().notification_canister.clone()).add_notification_withdraw(followed_data.data.unwrap(), withdraw_res.clone()).await.unwrap().0;
        }
        Ok(withdraw_res)
    }

    #[update]
    pub async fn follow(&self) -> Result<(), VaultError> {
        if self.if_followed() {
            return Err(VaultError::AlreadyFollowed);
        }
        let caller = ic_cdk::caller();
        let mut ledger_data = Followed::get_stable();
        if ledger_data.data.is_none() {
            ledger_data.data = Some(vec![]);
        }
        ledger_data.data.as_mut().unwrap().push(caller);
        Followed::set_stable(ledger_data);
        // add notification
        notification::Service(VaultConfig::get_stable().notification_canister.clone()).add_notification_followed(VaultConfig::get_stable().owner, caller).await.unwrap().0;
        Ok(())
    }

    #[update]
    pub async fn unfollow(&self) -> Result<(), VaultError> {
        if !self.if_followed() {
            return Err(VaultError::NotFollowed);
        }
        let caller = ic_cdk::caller();
        let mut ledger_data = Followed::get_stable();
        if ledger_data.data.is_none() {
            return Err(VaultError::NotFollowed);
        }
        let index = ledger_data.data.as_ref().unwrap().iter().position(|x| *x == caller).unwrap();
        ledger_data.data.as_mut().unwrap().remove(index);
        Followed::set_stable(ledger_data);
        // add notification
        notification::Service(VaultConfig::get_stable().notification_canister.clone()).add_notification_unfollowed(VaultConfig::get_stable().owner, caller).await.unwrap().0;
        Ok(())
    }

    /// only the controller can swap( approve -> deposit_from -> swap -> withdraw_from )
    #[update]
    pub async fn approve(&self, swap_pool_id: Principal, token0_id: Principal, amount: Nat) -> Result<(), VaultError> {
        let caller = ic_cdk::caller();
        if VaultConfig::get_stable().owner != caller {
            return Err(VaultError::NotController);
        }
        let token_ins = Icrc2Token::new(token0_id);
        let token_fee = token_ins.icrc1_fee().await.unwrap().0;
        let approve_result = token_ins.icrc2_approve(ApproveArgs{
            from_subaccount: None,
            spender: Account::from(swap_pool_id),
            amount: amount + token_fee.clone(),
            expected_allowance: None,
            expired_at: None,
            fee: Some(token_fee),
            memo: None,
            created_at_time: None,
        }).await.unwrap().0;
        if approve_result.is_err() {
            return Err(VaultError::ICRC2ApproveError(approve_result.unwrap_err()));
        }
        Ok(())
    }

    #[update]
    pub async fn deposit_from(&self, swap_pool_id: Principal, deposit_args: swap_pool::DepositArgs) -> Result<(), VaultError> {
        let caller = ic_cdk::caller();
        if VaultConfig::get_stable().owner != caller {
            return Err(VaultError::NotController);
        }
        let token_ins = Icrc2Token::new(Principal::from_str(&deposit_args.token).unwrap());
        let token_fee = token_ins.icrc1_fee().await.unwrap().0;
        let mut deposit_args_new = deposit_args.clone();
        deposit_args_new.amount = deposit_args.amount + token_fee.clone();
        let deposit_result = swap_pool::Service(swap_pool_id).deposit_from(deposit_args_new).await.unwrap().0;
        match deposit_result {
            swap_pool::Result_::Ok(_) => {
                Ok(())
            },
            swap_pool::Result_::Err(err) => {
                Err(VaultError::SwapPoolError(err))
            }
        }
    }

    #[update]
    pub async fn swap(&self, swap_pool_id: Principal, token0: Principal, token1: Principal, swap_args: swap_pool::SwapArgs) -> Result<Swap, VaultError> {
        let caller = ic_cdk::caller();
        if VaultConfig::get_stable().owner != caller {
            return Err(VaultError::NotController);
        }
        // to do: check if token1 are supported
        let swap_result = swap_pool::Service(swap_pool_id).swap(swap_args.clone()).await.unwrap().0;
        match swap_result {
            swap_pool::Result_::Ok(amount_out) => {
                let token_symbol = VaultConfig::get_stable().supported_tokens.iter().find(|item| item.canister_id == token0).unwrap().symbol.clone();
                if token_symbol == "" {
                    return Err(VaultError::TokenNotSupported);
                }
                let token0_ins = Icrc2Token::new(token0);
                let token0_decimals = token0_ins.icrc1_decimals().await.unwrap().0;
                let exchange_rate_human = self.get_exchange_rate(token_symbol).await?;
                let amount_in_f64 = swap_args.clone().amountIn.parse::<f64>().unwrap() / (10u64.pow(Into::<u32>::into(token0_decimals)) as f64);
                let token1_ins = Icrc2Token::new(token1);
                let token1_decimals = token1_ins.icrc1_decimals().await.unwrap().0;
                let amount_out_u128 :u128 = amount_out.clone().0.try_into().unwrap();
                let swap_res = Swap{
                    operator: caller,
                    token0,
                    token1,
                    token0_amount: amount_in_f64,
                    token1_amount: amount_out_u128 as f64 / 10u64.pow(token1_decimals.into()) as f64,
                    eq_usd: amount_in_f64 * exchange_rate_human,
                    pool_id: swap_pool_id,
                };
                // add record
                TxRecordsData::swap(swap_res.clone());
                let token1_symbol = VaultConfig::get_stable().supported_tokens.iter().find(|item| item.canister_id == token1).unwrap().symbol.clone();
                self.add_ledger_token(SupportedToken{
                    canister_id: token1,
                    symbol: token1_symbol,
                });
                // add notification
                let followed_data = Followed::get_stable();
                if followed_data.data.is_some() {
                    notification::Service(VaultConfig::get_stable().notification_canister.clone()).add_notification_swap(followed_data.data.unwrap(), swap_res.clone()).await.unwrap().0;
                }
                Ok(swap_res)
            },
            swap_pool::Result_::Err(err) => {
                Err(VaultError::SwapPoolError(err))
            }
        }
    }

    #[update]
    pub async fn withdraw_from(&self, swap_pool_id: Principal, withdraw_args: swap_pool::WithdrawArgs) -> Result<(), VaultError> {
        let caller = ic_cdk::caller();
        if VaultConfig::get_stable().owner != caller {
            return Err(VaultError::NotController);
        }
        let withdraw_result = swap_pool::Service(swap_pool_id).withdraw(withdraw_args).await.unwrap().0;
        match withdraw_result {
            swap_pool::Result_::Ok(_) => {
                Ok(())
            },
            swap_pool::Result_::Err(err) => {
                Err(VaultError::SwapPoolError(err))
            }
        }
    }

    pub async fn get_exchange_rate(&self, symbol: String) -> Result<f64, VaultError> {
        let exchange_rate_result = Service::new(VaultConfig::get_stable().exchange_rate_canister.clone()).get_exchange_rate(GetExchangeRateRequest{
            timestamp: None,
                quote_asset: Asset{
                    class: AssetClass::Cryptocurrency,
                    symbol: "USDT".to_string(),
                },
                base_asset: Asset{
                    class: AssetClass::Cryptocurrency,
                    symbol,
                },
        }).await.unwrap().0;
        match exchange_rate_result {
            GetExchangeRateResult::Ok(exchange_rate) => {
                Ok(exchange_rate.rate as f64 / 10u64.pow(exchange_rate.metadata.decimals as u32) as f64)
            },
            GetExchangeRateResult::Err(_) => {
                Err(VaultError::ExchangeRateError)
            }
        }
    }

    pub fn add_ledger_token(&self, new_token: SupportedToken) {
        // update ledger
        let mut ledger_data = VaultLedger::get_stable();
        if ledger_data.tokens.is_none() {
            ledger_data.tokens = Some(vec![]);
        }
        if !ledger_data.tokens.as_ref().unwrap().contains(&new_token) {
            ledger_data.tokens.as_mut().unwrap().push(new_token);
            VaultLedger::set_stable(ledger_data);
        }
        ()
    }
}