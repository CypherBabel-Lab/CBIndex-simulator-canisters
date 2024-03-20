use std::{cell::RefCell, borrow::Cow};
use candid::{CandidType, Decode, Deserialize, Encode, Nat, Principal};
use ic_exports::ic_cdk;
use ic_stable_structures::{MemoryId,StableCell,Storable};
use crate::exchange_rate:: {
    AssetClass,
    Asset,
    GetExchangeRateRequest,
    GetExchangeRateResult,
    Service,
};

use crate:: state::config::VaultConfig;
use crate:: icrc::icrc1::Icrc1;
use crate:: icrc::icrc2;
use crate:: Account;

use super::config::SupportedToken;

const LEDGER_MEMORY_ID: MemoryId = MemoryId::new(1);
const DEFAULT_NAV:u8 =  100;

thread_local! {
    static VAULT_LEDGER_CELL: RefCell<StableCell<VaultLedger>> = {
            RefCell::new(StableCell::new(LEDGER_MEMORY_ID, VaultLedger::default())
                .expect("stable memory vault ledger initialization failed"))
    }
}

#[derive(Deserialize, CandidType, Clone, Debug)]
pub struct VaultLedgerTokenAum {
    pub token_id: Principal,
    pub balance: f64,
    pub price: f64,
    pub aum: f64,
    pub decimals: u8,
}

#[derive(Deserialize, CandidType, Clone, Debug)]
pub struct VaultLedgerTokensAum {
    pub datas: Option<Vec<VaultLedgerTokenAum>>,
}

impl VaultLedgerTokensAum {
    pub fn aum(&self) -> f64 {
        match self.datas.clone() {
            Some(datas) => {
                let mut aum = 0.0;
                for data in datas {
                    aum = aum + data.balance * data.price;
                }
                aum
            },
            None => 0_f64,
        }
    }
}


#[derive(Deserialize, CandidType, Clone, Debug)]
pub struct VaultLedger {
    pub tokens: Option<Vec<SupportedToken>>,
}

impl Default for VaultLedger {
    fn default() -> Self {
        VaultLedger {
            tokens: None,
        } 
    }
}

impl Storable for VaultLedger {
    // Stable storage expects non-failing serialization/deserialization.

    fn to_bytes(&self) -> Cow<'_, [u8]> {
        Cow::Owned(Encode!(self).expect("failed to encode token config"))
    }

    fn from_bytes(bytes: Cow<'_, [u8]>) -> Self {
        Decode!(&bytes, Self).expect("failed to decode token config")
    }
}

impl VaultLedger {
    pub fn get_stable() -> VaultLedger {
        VAULT_LEDGER_CELL.with(|c| c.borrow().get().clone())
    }

    pub fn set_stable(ledger: VaultLedger) {
        VAULT_LEDGER_CELL.with(|c| c.borrow_mut().set(ledger))
            .expect("unable to set vault ledger to stable memory")
    }

    pub async fn get_aum(&self) -> VaultLedgerTokensAum {
        match self.tokens.clone() {
            Some(tokens) => {
                let mut result: Vec<VaultLedgerTokenAum> = vec![];
                let mut if_error = false;
                for token in tokens {
                    let icrc = icrc2::Icrc2Token::new(token.canister_id.clone());
                    let decimals_token = icrc.icrc1_decimals().await.unwrap().0;
                    let balance = icrc.icrc1_balance_of(Account::from(ic_cdk::id())).await.unwrap().0;
                    if balance == Nat::from(0) {
                        continue;
                    }
                    let exchange_rate_result = Service::new(VaultConfig::get_stable().exchange_rate_canister.clone()).get_exchange_rate(GetExchangeRateRequest{
                        timestamp: None,
                        quote_asset: Asset{
                            class: AssetClass::Cryptocurrency,
                            symbol: "USDT".to_string(),
                        },
                        base_asset: Asset{
                            class: AssetClass::Cryptocurrency,
                            symbol: token.symbol.clone(),
                        },
                    }).await.unwrap().0;
                    match exchange_rate_result {
                        GetExchangeRateResult::Ok(exchange_rate) => {
                            let rate = exchange_rate.rate;
                            let decimals = exchange_rate.metadata.decimals;
                            let exchange_rate = (rate as f64) / (10u64.pow(decimals) as f64);
                            let balance_u64 :u128 = balance.clone().0.try_into().unwrap();
                            let balance_f64 = balance_u64 as f64/ (10u64.pow(decimals_token.into()) as f64);
                            // aum = aum + balance_f64 * exchange_rate;
                            result.push(VaultLedgerTokenAum{
                                token_id: token.canister_id.clone(),
                                balance: balance_f64,
                                price: exchange_rate,
                                aum: balance_f64 * exchange_rate,
                                decimals: decimals_token,
                            });
                        },
                        GetExchangeRateResult::Err(_) => {
                            ic_cdk::print("get exchange rate error");
                            if_error = true;
                        }
                        
                    };
                }
                if if_error {
                    VaultLedgerTokensAum{datas: None}
                } else {
                    VaultLedgerTokensAum{datas: Some(result)}
                }
            },
            None => VaultLedgerTokensAum{datas: None},
        }
    }

    pub async fn get_nav(&self) -> f64 {
        let aum = self.get_aum().await;
        let shares_token = VaultConfig::get_stable().shares_token;
        let icrc = icrc2::Icrc2Token::new(shares_token.unwrap());
        let token_decimails = icrc.icrc1_decimals().await.unwrap().0;
        let total_supply = icrc.icrc1_total_supply().await.unwrap().0;
        if total_supply.clone() == Nat::from(0){
            DEFAULT_NAV as f64
        } else {
            let total_supply_u128 :u128 = total_supply.clone().0.try_into().unwrap();
            aum.aum() / ( total_supply_u128 as f64) *  (10u64.pow(token_decimails.into()) as f64)
        }
    }

    pub fn get_tokens(&self) -> Vec<SupportedToken> {
        self.tokens.clone().unwrap_or(vec![])
    }
}