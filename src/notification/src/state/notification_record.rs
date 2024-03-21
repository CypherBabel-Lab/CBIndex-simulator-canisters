use candid::{CandidType, Deserialize, Principal};
use ic_exports::ic_cdk;
use std::{borrow::Cow, cell::RefCell};
use std::collections::HashMap;

use vault::record::{Record, Deposit, Withdraw,Swap};
use ic_stable_structures::{BoundedStorable, MemoryId, StableBTreeMap, Storable};

const MAX_HISTORY_LENGTH: usize = 1_000_000;
const HISTORY_REMOVAL_BATCH_SIZE: usize = 10_000;
const TOTAL_RECORD_COUNT_MEMORY_ID: MemoryId = MemoryId::new(0);

thread_local! {
    static TX_RECORDS: RefCell<HashMap<Principal, NotificationRecords>> = RefCell::default();
    static TOTAL_RECORD_COUNT: RefCell<StableBTreeMap<StringKey,u64>> =
        RefCell::new(StableBTreeMap::new(TOTAL_RECORD_COUNT_MEMORY_ID));
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

pub struct NotificationRecordsData;

impl NotificationRecordsData {
    pub fn is_empty(key: Principal) -> bool {
        Self::with_tx_records(key,|tx_records| tx_records.is_empty(key))
    }

    pub fn len(key: Principal) -> u64 {
        Self::with_tx_records(key,|tx_records| tx_records.len(key))
    }

    pub fn get(key: Principal, id: TxId) -> Option<NotificationRecord> {
        Self::with_tx_records(key,|tx_records| tx_records.get(id, key))
    }

    pub fn get_records(
        key: Principal,
        count: usize,
        index_id: Option<TxId>,
    ) -> PaginatedResult {
        Self::with_tx_records(key,|tx_records| tx_records.get_records(count, index_id))
    }

    pub fn followed(key: Principal, vault: Principal) -> TxId {
        Self::with_tx_records(key,|tx_records| tx_records.followed(key,vault))
    }

    pub fn unfollowed(key: Principal, vault: Principal) -> TxId {
        Self::with_tx_records(key,|tx_records| tx_records.unfollowed(key,vault))
    }

    pub fn deposit(key: Principal, vault: Principal, record: Deposit) -> TxId {
        Self::with_tx_records(key,|tx_records| tx_records.deposit(key,vault,record))
    }

    pub fn withdraw(key: Principal, vault: Principal, record: Withdraw) -> TxId {
        Self::with_tx_records(key, |tx_records| tx_records.withdraw(key,vault,record))
    }

    pub fn swap(key: Principal, vault: Principal, record: Swap) -> TxId {
        Self::with_tx_records(key,|tx_records| tx_records.swap(key,vault,record))
    }

    pub fn clear(key: Principal,) {
        Self::with_tx_records(key,|tx_records| tx_records.clear(key))
    }

    fn with_tx_records<F, R>(key: Principal, f: F) -> R
    where
        F: FnOnce(&mut NotificationRecords) -> R,
    {
        TX_RECORDS.with(|tx_records_map| {
            let mut borrowed = tx_records_map.borrow_mut();
            let tx_records = borrowed.entry(key).or_default();
            f(tx_records)
        })
    }
}

pub type TxId = u64;

#[derive(Debug, Clone, CandidType, Deserialize)]
pub struct PaginatedResult {
    pub result: Vec<NotificationRecord>,
    pub next: Option<TxId>,
}

#[derive(Debug, Clone, CandidType, Deserialize)]
pub enum Notification {
    Followed(Principal),
    Unfollowed(Principal),
    TxRecord(Principal, Record),
}

#[derive(Deserialize, CandidType, Clone, Debug)]
pub struct NotificationRecord {
    pub id: TxId,
    pub record: Notification,
    pub timestamp: u64,
}

#[derive(Debug, Default, CandidType, Deserialize)]
pub struct NotificationRecords {
    pub data: Vec<NotificationRecord>,
}

impl NotificationRecords {
    pub fn is_empty(&self, key: Principal) -> bool {
        self.len(key) == 0
    }

    pub fn len(&self, key: Principal) -> u64 {
        Self::read_total_tx_count(key)
    }

    fn next_id(&self, key: Principal) -> TxId {
        Self::read_total_tx_count(key)
    }

    pub fn get(&self, id: TxId, key: Principal) -> Option<NotificationRecord> {
        self.data.get(self.get_index(id, key)?).cloned()
    }

    fn get_index(&self, id: TxId, key: Principal) -> Option<usize> {
        let first_stored_tx_id = Self::read_total_tx_count(key) - self.data.len() as u64; // Always >= 0
        if id < first_stored_tx_id || id > usize::MAX as TxId {
            None
        } else {
            Some((id - first_stored_tx_id) as usize)
        }
    }

    pub fn get_records(
        &self,
        count: usize,
        index_id: Option<TxId>,
    ) -> PaginatedResult {
        let mut records = self
            .data
            .iter()
            .rev()
            .filter(|tx| index_id.map_or(true, |id| id >= tx.id))
            .take(count + 1)
            .cloned()
            .collect::<Vec<_>>();

        let next_id = if records.len() == count + 1 {
            Some(records.remove(count).id)
        } else {
            None
        };

        PaginatedResult {
            result: records,
            next: next_id,
        }
    }

    pub fn followed(&mut self, key: Principal, vault: Principal) -> TxId {
        let id = self.next_id(key);
        ic_cdk::print(format!("followed: {}",id));
        self.push(key,NotificationRecord {
            id,
            record: Notification::Followed(vault),
            timestamp: ic_cdk::api::time(),
        });
        id
    }

    pub fn unfollowed(&mut self, key: Principal, vault: Principal) -> TxId {
        let id = self.next_id(key);
        self.push(key,NotificationRecord {
            id,
            record: Notification::Unfollowed(vault),
            timestamp: ic_cdk::api::time(),
        });
        id
    }

    pub fn deposit(&mut self, key: Principal,vault: Principal, record: Deposit) -> TxId {
        let id = self.next_id(key);
        self.push(key,NotificationRecord {
            id,
            record: Notification::TxRecord(vault,Record::Deposit(record)),
            timestamp: ic_cdk::api::time(),
        });
        id
    }

    pub fn withdraw(&mut self, key: Principal, vault: Principal, record: Withdraw) -> TxId {
        let id = self.next_id(key);
        self.push( key, NotificationRecord {
            id,
            record: Notification::TxRecord(vault, Record::Withdraw(record)),
            timestamp: ic_cdk::api::time(),
        });
        id
    }

    pub fn swap(&mut self, key: Principal,vault: Principal, record: Swap) -> TxId {
        let id = self.next_id(key);
        self.push(key,NotificationRecord {
            id,
            record: Notification::TxRecord(vault, Record::Swap(record)),
            timestamp: ic_cdk::api::time(),
        });
        id
    }


    pub fn clear(&mut self, key: Principal) {
        self.data.clear();
        TOTAL_RECORD_COUNT.with(|map| {
            map
                .borrow_mut()
                .insert(StringKey(key.to_string()),0)
                .expect("fail to write total tx count")
        });
    }

    fn push(&mut self, key: Principal, record: NotificationRecord) {
        self.data.push(record);
        Self::increase_total_tx_count(key);
        if self.data.len() > MAX_HISTORY_LENGTH + HISTORY_REMOVAL_BATCH_SIZE {
            self.data = self.data[HISTORY_REMOVAL_BATCH_SIZE..].into();
        }
    }

    fn increase_total_tx_count(key: Principal) {
        let prev_count = Self::read_total_tx_count(key);
        ic_cdk::println!("prev_count: {}",prev_count);
        ic_cdk::println!("key: {}",key);
        TOTAL_RECORD_COUNT.with(|map| {
            map
                .borrow_mut()
                .insert(StringKey(key.to_string()),prev_count + 1)
        });
    }

    fn read_total_tx_count(key: Principal) -> u64 {
        TOTAL_RECORD_COUNT.with(|map| map.borrow().get(&StringKey(key.to_string())).unwrap_or(0))
    }
}