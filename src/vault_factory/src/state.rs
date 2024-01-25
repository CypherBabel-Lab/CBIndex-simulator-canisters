use std::borrow::Cow;
use std::cell::RefCell;

use candid::{CandidType, Decode, Encode, Principal};
use ic_stable_structures::{BoundedStorable, MemoryId, StableBTreeMap, StableCell, Storable};
use serde::Deserialize;

#[derive(CandidType, Deserialize, Default, Debug)]
pub struct State {}

impl State {
    pub fn reset(&mut self) {
        VAULTS_MAP.with(|map| map.borrow_mut().clear());
        TOKEN_WASM_CELL.with(|cell| {
            cell.borrow_mut()
                .set(StorableWasm::default())
                .expect("failed to reset vault wasm in stable memory")
        });
        VAULT_WASM_CELL.with(|cell| {
            cell.borrow_mut()
                .set(StorableWasm::default())
                .expect("failed to reset vault wasm in stable memory")
        });
    }

    pub fn get_vault(&self, name: String) -> Option<PrincipalValue> {
        Self::check_name(&name).then_some(())?;

        VAULTS_MAP
            .with(|map| map.borrow().get(&StringKey(name)))
    }

    pub fn get_vaults(&self) -> Vec<PrincipalValue> {
        VAULTS_MAP
            .with(|map| map.borrow().iter().map(|(_, v)| v.clone()).collect())
    }

    pub fn remove_vault(&self, name: String) -> Option<Principal> {
        Self::check_name(&name).then_some(())?;

        VAULTS_MAP
            .with(|map| map.borrow_mut().remove(&StringKey(name)))
            .map(|principal| principal.0)
    }

    pub fn insert_vault(&mut self, name: String, principals: PrincipalValue) {
        VAULTS_MAP.with(|map| {
            map.borrow_mut()
                .insert(StringKey(name), principals)
        });
    }

    pub fn get_vault_wasm(&self) -> Option<Vec<u8>> {
        VAULT_WASM_CELL.with(|cell| cell.borrow().get().0.clone())
    }

    pub fn set_vault_wasm(&mut self, wasm: Option<Vec<u8>>) {
        VAULT_WASM_CELL.with(|cell| {
            cell.borrow_mut()
                .set(StorableWasm(wasm))
                .expect("failed to set vault canister wasm to stable storage");
        });
    }

    pub fn get_token_wasm(&self) -> Option<Vec<u8>> {
        TOKEN_WASM_CELL.with(|cell| cell.borrow().get().0.clone())
    }

    pub fn set_token_wasm(&mut self, wasm: Option<Vec<u8>>) {
        TOKEN_WASM_CELL.with(|cell| {
            cell.borrow_mut()
                .set(StorableWasm(wasm))
                .expect("failed to set token canister wasm to stable storage");
        });
    }

    fn check_name(name: &str) -> bool {
        name.as_bytes().len() <= MAX_TOKEN_LEN_IN_BYTES
    }
}

#[derive(Default, Deserialize, CandidType)]
struct StorableWasm(Option<Vec<u8>>);

impl Storable for StorableWasm {
    fn to_bytes(&self) -> Cow<'_, [u8]> {
        Encode!(self)
            .expect("failed to encode StorableWasm for stable storage")
            .into()
    }

    fn from_bytes(bytes: Cow<'_, [u8]>) -> Self {
        Decode!(&bytes, Self).expect("failed to decode StorableWasm from stable storage")
    }
}

#[derive(Clone, PartialEq, Eq, PartialOrd, Ord)]
struct StringKey(String);

impl Storable for StringKey {
    fn to_bytes(&self) -> Cow<'_, [u8]> {
        self.0.as_bytes().into()
    }

    fn from_bytes(bytes: Cow<'_, [u8]>) -> Self {
        StringKey(String::from_bytes(bytes))
    }
}

pub const MAX_TOKEN_LEN_IN_BYTES: usize = 1024;

impl BoundedStorable for StringKey {
    const MAX_SIZE: u32 = MAX_TOKEN_LEN_IN_BYTES as _;

    const IS_FIXED_SIZE: bool = false;
}

#[derive(Deserialize, CandidType, Clone, Debug)]
pub struct PrincipalValue(Principal, Principal);

impl PrincipalValue {
    pub fn new(principal: Principal, principal2: Principal) -> Self {
        PrincipalValue(principal, principal2)
    }
}

impl Storable for PrincipalValue {
    fn to_bytes(&self) -> Cow<'_, [u8]> {
        let mut bytes = self.0.as_slice().to_vec();
        bytes.extend_from_slice(self.1.as_slice());
        bytes.into()
    }

    fn from_bytes(bytes: Cow<'_, [u8]>) -> Self {
        let mut bytes = bytes.into_owned();
        let principal = Principal::from_slice(&bytes.split_off(29));
        let principal2 = Principal::from_slice(&bytes);
        PrincipalValue(principal, principal2)
    }
}

impl BoundedStorable for PrincipalValue {
    const MAX_SIZE: u32 = 29 * 2;
    const IS_FIXED_SIZE: bool = false;
}

// starts with 10 because 0..10 reserved for `ic-factory` state.
const TOKEN_WASM_MEMORY_ID: MemoryId = MemoryId::new(10);
const VAULT_WASM_MEMORY_ID: MemoryId = MemoryId::new(11);
const VAULTS_MEMORY_ID: MemoryId = MemoryId::new(12);

thread_local! {
    static TOKEN_WASM_CELL: RefCell<StableCell<StorableWasm>> = {
            RefCell::new(StableCell::new(TOKEN_WASM_MEMORY_ID, StorableWasm::default())
                .expect("failed to initialize token wasm stable storage"))
    };

    static VAULT_WASM_CELL: RefCell<StableCell<StorableWasm>> = {
        RefCell::new(StableCell::new(VAULT_WASM_MEMORY_ID, StorableWasm::default())
            .expect("failed to initialize vault wasm stable storage"))
};

    static VAULTS_MAP: RefCell<StableBTreeMap<StringKey, PrincipalValue>> =
        RefCell::new(StableBTreeMap::new(VAULTS_MEMORY_ID));
}

pub fn get_state() -> State {
    State::default()
}

#[cfg(test)]
mod tests {
    use candid::Principal;
    use ic_stable_structures::Storable;

    use crate::state::{PrincipalValue, StorableWasm};

    use super::StringKey;

    #[test]
    fn string_key_serialization() {
        let key = StringKey("".into());
        let deserialized = StringKey::from_bytes(key.to_bytes());
        assert_eq!(key.0, deserialized.0);

        let key = StringKey("TEST_KEY".into());
        let deserialized = StringKey::from_bytes(key.to_bytes());
        assert_eq!(key.0, deserialized.0);

        let long_key = StringKey(String::from_iter(std::iter::once('c').cycle().take(512)));
        let deserialized = StringKey::from_bytes(long_key.to_bytes());
        assert_eq!(long_key.0, deserialized.0);
    }

    #[test]
    fn principal_value_serialization() {
        let val = PrincipalValue(Principal::anonymous(), Principal::anonymous());
        let deserialized = PrincipalValue::from_bytes(val.to_bytes());
        assert_eq!(val.0, deserialized.0);

        let val = PrincipalValue(Principal::management_canister(), Principal::management_canister());
        let deserialized = PrincipalValue::from_bytes(val.to_bytes());
        assert_eq!(val.0, deserialized.0);
    }

    #[test]
    fn storable_wasm_serialization() {
        let val = StorableWasm(None);
        let deserialized = StorableWasm::from_bytes(val.to_bytes());
        assert_eq!(val.0, deserialized.0);

        let val = StorableWasm(Some(vec![]));
        let deserialized = StorableWasm::from_bytes(val.to_bytes());
        assert_eq!(val.0, deserialized.0);

        let val = StorableWasm(Some((1..255).collect()));
        let deserialized = StorableWasm::from_bytes(val.to_bytes());
        assert_eq!(val.0, deserialized.0);
    }
}
