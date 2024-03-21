use std::{cell::RefCell, borrow::Cow};
use candid::{CandidType, Decode, Deserialize, Encode, Principal};
use ic_stable_structures::{MemoryId,StableCell,Storable};

const LEDGER_MEMORY_ID: MemoryId = MemoryId::new(1);

thread_local! {
    static WHITELIST_CELL: RefCell<StableCell<Whitelist>> = {
            RefCell::new(StableCell::new(LEDGER_MEMORY_ID, Whitelist::default())
                .expect("stable memory whitelist initialization failed"))
    }
}

#[derive(Deserialize, CandidType, Clone, Debug)]
pub struct Whitelist {
    pub data: Option<Vec<Principal>>,
}

impl Default for Whitelist {
    fn default() -> Self {
        Whitelist {
            data: None,
        } 
    }
}

impl Storable for Whitelist {
    // Stable storage expects non-failing serialization/deserialization.

    fn to_bytes(&self) -> Cow<'_, [u8]> {
        Cow::Owned(Encode!(self).expect("failed to encode whitelist"))
    }

    fn from_bytes(bytes: Cow<'_, [u8]>) -> Self {
        Decode!(&bytes, Self).expect("failed to decode whitelist")
    }
}

impl Whitelist {
    pub fn get_stable() -> Whitelist {
        WHITELIST_CELL.with(|c| c.borrow().get().clone())
    }

    pub fn set_stable(ledger: Whitelist) {
        WHITELIST_CELL.with(|c| c.borrow_mut().set(ledger))
            .expect("unable to set whitelist to stable memory")
    }
}