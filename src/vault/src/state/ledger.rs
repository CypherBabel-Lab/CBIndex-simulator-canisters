use std::{cell::RefCell, borrow::Cow};

use candid::{CandidType,Deserialize, Encode, Decode, Nat};
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

thread_local! {
    static VAULT_LEDGER_CELL: RefCell<StableCell<VaultLedger>> = {
            RefCell::new(StableCell::new(LEDGER_MEMORY_ID, VaultLedger::default())
                .expect("stable memory vault ledger initialization failed"))
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

    pub async fn get_aum(&self) -> Nat {
        match self.tokens.clone() {
            Some(tokens) => {
                let mut aum = Nat::from(0);
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
                            symbol: token.symbol.clone(),
                        },
                        base_asset: Asset{
                            class: AssetClass::FiatCurrency,
                            symbol: "USD".to_string(),
                        },
                    }).await.unwrap().0;
                    match exchange_rate_result {
                        GetExchangeRateResult::Ok(exchange_rate) => {
                            let rate = exchange_rate.rate;
                            let decimals = exchange_rate.metadata.decimals;
                            let exchange_rate = rate / 10u64.pow(decimals);
                            let balance = balance / 10u64.pow(decimals_token.into());
                            aum = aum + balance * exchange_rate;
                        },
                        GetExchangeRateResult::Err(_) => {
                            ic_cdk::print("get exchange rate error");
                            if_error = true;
                        }
                        
                    };
                }
                if if_error {
                    Nat::from(0)
                } else {
                    aum
                }
            },
            None => Nat::from(100),
        }
    }

    pub async fn get_nav(&self) -> Nat {
        let aum = self.get_aum().await;
        let shares_token = VaultConfig::get_stable().shares_token;
        let icrc = icrc2::Icrc2Token::new(shares_token.unwrap());
        let total_supply = icrc.icrc1_total_supply().await.unwrap().0;
        if total_supply == Nat::from(0){
            Nat::from(0)
        } else {
            aum / total_supply
        }
    }

    pub fn get_tokens(&self) -> Vec<SupportedToken> {
        self.tokens.clone().unwrap_or(vec![])
    }

    pub fn add_token(&mut self, token: SupportedToken) {
        let mut tokens = self.tokens.clone().unwrap_or(vec![]);
        tokens.push(token);
        self.tokens = Some(tokens);
    }
}