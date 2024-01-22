use std::{cell::RefCell, borrow::Cow};

use candid::{Principal, CandidType,Deserialize, Encode, Decode};
use ic_stable_structures::{MemoryId,StableCell,Storable};

#[derive(Deserialize, CandidType, Clone, Debug)]
pub struct VaultLedger {
    pub tokens: Option<Vec<Principal>>,
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

    pub fn get_aum(&self) -> u64 {
        // match self.tokens.clone() {
        //     Some(tokens) => {
        //         let mut aum = 0;
        //         for token in tokens {
        //             aum += 1;
        //         }
        //         aum
        //     },
        //     None => 0,
            
        // }
        0
    }

    pub fn get_nav(&self) -> u64 {
        0
    }

    pub fn get_tokens(&self) -> Vec<Principal> {
        self.tokens.clone().unwrap_or(vec![])
    }

    pub fn add_token(&mut self, token: Principal) {
        let mut tokens = self.tokens.clone().unwrap_or(vec![]);
        tokens.push(token);
        self.tokens = Some(tokens);
    }
}

const LEDGER_MEMORY_ID: MemoryId = MemoryId::new(1);

thread_local! {
    static VAULT_LEDGER_CELL: RefCell<StableCell<VaultLedger>> = {
            RefCell::new(StableCell::new(LEDGER_MEMORY_ID, VaultLedger::default())
                .expect("stable memory vault ledger initialization failed"))
    }
}