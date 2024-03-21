use std::{cell::RefCell, borrow::Cow};
use candid::{CandidType, Decode, Deserialize, Encode, Principal};
use ic_stable_structures::{MemoryId,StableCell,Storable};

const LEDGER_MEMORY_ID: MemoryId = MemoryId::new(2);

thread_local! {
    static CONTROLLER_CELL: RefCell<StableCell<Controller>> = {
            RefCell::new(StableCell::new(LEDGER_MEMORY_ID, Controller::default())
                .expect("stable memory controller initialization failed"))
    }
}

#[derive(Deserialize, CandidType, Clone, Debug)]
pub struct Controller(pub Principal);

impl Default for Controller {
    fn default() -> Self {
        Controller(Principal::anonymous())
    }
}

impl Storable for Controller {
    // Stable storage expects non-failing serialization/deserialization.

    fn to_bytes(&self) -> Cow<'_, [u8]> {
        Cow::Owned(Encode!(self).expect("failed to encode controller"))
    }

    fn from_bytes(bytes: Cow<'_, [u8]>) -> Self {
        Decode!(&bytes, Self).expect("failed to decode controller")
    }
}

impl Controller {
    pub fn get_stable() -> Controller {
        CONTROLLER_CELL.with(|c| c.borrow().get().clone())
    }

    pub fn set_stable(co: Controller) {
        CONTROLLER_CELL.with(|c| c.borrow_mut().set(co))
            .expect("unable to set controller to stable memory")
    }

    pub fn check(caller: Principal) ->bool {
        CONTROLLER_CELL.with(|c| c.borrow().get().0 == caller)
    }
}