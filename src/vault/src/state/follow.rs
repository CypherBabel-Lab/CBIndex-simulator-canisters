use std::{cell::RefCell, borrow::Cow};
use candid::{CandidType, Decode, Deserialize, Encode, Principal};
use ic_stable_structures::{MemoryId,StableCell,Storable};

const LEDGER_MEMORY_ID: MemoryId = MemoryId::new(3);

thread_local! {
    static FOLLOWED_CELL: RefCell<StableCell<Followed>> = {
            RefCell::new(StableCell::new(LEDGER_MEMORY_ID, Followed::default())
                .expect("stable memory followed initialization failed"))
    }
}

#[derive(Deserialize, CandidType, Clone, Debug)]
pub struct Followed {
    pub data: Option<Vec<Principal>>,
}

impl Default for Followed {
    fn default() -> Self {
        Followed {
            data: None,
        } 
    }
}

impl Storable for Followed {
    // Stable storage expects non-failing serialization/deserialization.

    fn to_bytes(&self) -> Cow<'_, [u8]> {
        Cow::Owned(Encode!(self).expect("failed to encode followed"))
    }

    fn from_bytes(bytes: Cow<'_, [u8]>) -> Self {
        Decode!(&bytes, Self).expect("failed to decode followed")
    }
}

impl Followed {
    pub fn get_stable() -> Followed {
        FOLLOWED_CELL.with(|c| c.borrow().get().clone())
    }

    pub fn set_stable(ledger: Followed) {
        FOLLOWED_CELL.with(|c| c.borrow_mut().set(ledger))
            .expect("unable to set followed to stable memory")
    }
}