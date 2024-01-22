use std::{cell::RefCell, borrow::Cow};

use candid::{Principal, Encode, Decode, CandidType, Deserialize};
use ic_stable_structures::{MemoryId, StableCell, Storable};

#[derive(Deserialize, CandidType, Clone, Debug)]
pub struct VaultConfig {
    pub name: String,
    pub symbol: String,
    pub owner: Principal,
    pub deploy_time: u64,
    pub supported_tokens: Vec<Principal>,
    pub shares_token: Principal,
    pub exchange_rate_canister: Principal,
}

impl Default for VaultConfig {
    fn default() -> Self {
        VaultConfig {
            name: "".to_string(),
            symbol: "".to_string(),
            owner: Principal::anonymous(),
            deploy_time: 0,
            supported_tokens: vec![],
            shares_token: Principal::anonymous(),
            exchange_rate_canister: Principal::anonymous(),
        }
    }
}

impl Storable for VaultConfig {
    // Stable storage expects non-failing serialization/deserialization.

    fn to_bytes(&self) -> Cow<'_, [u8]> {
        Cow::Owned(Encode!(self).expect("failed to encode token config"))
    }

    fn from_bytes(bytes: Cow<'_, [u8]>) -> Self {
        Decode!(&bytes, Self).expect("failed to decode token config")
    }
}

impl VaultConfig {
    pub fn get_stable() -> VaultConfig {
        VAULT_CONFIG_CELL.with(|c| c.borrow().get().clone())
    }

    pub fn set_stable(config: VaultConfig) {
        VAULT_CONFIG_CELL.with(|c| c.borrow_mut().set(config))
            .expect("unable to set vault config to stable memory")
    }
}

const CONFIG_MEMORY_ID: MemoryId = MemoryId::new(0);

thread_local! {
    static VAULT_CONFIG_CELL: RefCell<StableCell<VaultConfig>> = {
            RefCell::new(StableCell::new(CONFIG_MEMORY_ID, VaultConfig::default())
                .expect("stable memory vault config initialization failed"))
    }
}