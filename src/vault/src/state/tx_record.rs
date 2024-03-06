use candid::{CandidType, Deserialize, Principal};
use ic_exports::{ic_cdk, ic_kit::ic};
use std::cell::RefCell;
use std::collections::HashMap;

use crate::record::{Record, Deposit, Withdraw,Swap};
use ic_stable_structures::{MemoryId, StableCell};

const MAX_HISTORY_LENGTH: usize = 1_000_000;
const HISTORY_REMOVAL_BATCH_SIZE: usize = 10_000;
const TOTAL_TX_COUNT_MEMORY_ID: MemoryId = MemoryId::new(2);

thread_local! {
    static TX_RECORDS: RefCell<HashMap<Principal, TxRecords>> = RefCell::default();
    static TOTAL_TX_COUNT: RefCell<StableCell<u64>> =
        RefCell::new(StableCell::new(TOTAL_TX_COUNT_MEMORY_ID, 0)
            .expect("unable to initialize index offset for ledger"));
}

pub struct TxRecordsData;

impl TxRecordsData {
    pub fn is_empty() -> bool {
        Self::with_tx_records(|tx_records| tx_records.is_empty())
    }

    pub fn len() -> u64 {
        Self::with_tx_records(|tx_records| tx_records.len())
    }

    pub fn get(id: TxId) -> Option<TxRecord> {
        Self::with_tx_records(|tx_records| tx_records.get(id))
    }

    pub fn get_records(
        count: usize,
        index_id: Option<TxId>,
    ) -> PaginatedResult {
        Self::with_tx_records(|tx_records| tx_records.get_records(count, index_id))
    }

    pub fn deposit(record: Deposit) -> TxId {
        Self::with_tx_records(|tx_records| tx_records.deposit(record))
    }

    pub fn withdraw(record: Withdraw) -> TxId {
        Self::with_tx_records(|tx_records| tx_records.withdraw(record))
    }

    pub fn swap(record: Swap) -> TxId {
        Self::with_tx_records(|tx_records| tx_records.swap(record))
    }

    pub fn clear() {
        Self::with_tx_records(|tx_records| tx_records.clear())
    }

    fn with_tx_records<F, R>(f: F) -> R
    where
        F: FnOnce(&mut TxRecords) -> R,
    {
        TX_RECORDS.with(|tx_records_map| {
            let canister_id = ic::id();
            let mut borrowed = tx_records_map.borrow_mut();
            let tx_records = borrowed.entry(canister_id).or_default();
            f(tx_records)
        })
    }
}

pub type TxId = u64;

#[derive(Debug, Clone, CandidType, Deserialize)]
pub struct PaginatedResult {
    pub result: Vec<TxRecord>,
    pub next: Option<TxId>,
}

#[derive(Deserialize, CandidType, Clone, Debug)]
pub struct TxRecord {
    pub id: TxId,
    pub record: Record,
    pub timestamp: u64,
}

#[derive(Debug, Default, CandidType, Deserialize)]
pub struct TxRecords {
    pub history: Vec<TxRecord>,
}

impl TxRecords {
    pub fn is_empty(&self) -> bool {
        self.len() == 0
    }

    pub fn len(&self) -> u64 {
        Self::read_total_tx_count()
    }

    fn next_id(&self) -> TxId {
        Self::read_total_tx_count()
    }

    pub fn get(&self, id: TxId) -> Option<TxRecord> {
        self.history.get(self.get_index(id)?).cloned()
    }

    fn get_index(&self, id: TxId) -> Option<usize> {
        let first_stored_tx_id = Self::read_total_tx_count() - self.history.len() as u64; // Always >= 0
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
            .history
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

    pub fn deposit(&mut self, record: Deposit) -> TxId {
        let id = self.next_id();
        self.push(TxRecord {
            id,
            record: Record::Deposit(record),
            timestamp: ic_cdk::api::time(),
        });
        id
    }

    pub fn withdraw(&mut self, record: Withdraw) -> TxId {
        let id = self.next_id();
        self.push(TxRecord {
            id,
            record: Record::Withdraw(record),
            timestamp: ic_cdk::api::time(),
        });
        id
    }

    pub fn swap(&mut self, record: Swap) -> TxId {
        let id = self.next_id();
        self.push(TxRecord {
            id,
            record: Record::Swap(record),
            timestamp: ic_cdk::api::time(),
        });
        id
    }


    pub fn clear(&mut self) {
        self.history.clear();
        TOTAL_TX_COUNT.with(|count| {
            count
                .borrow_mut()
                .set(0)
                .expect("fail to write total tx count")
        });
    }

    fn push(&mut self, record: TxRecord) {
        self.history.push(record);
        Self::increase_total_tx_count();
        if self.history.len() > MAX_HISTORY_LENGTH + HISTORY_REMOVAL_BATCH_SIZE {
            self.history = self.history[HISTORY_REMOVAL_BATCH_SIZE..].into();
        }
    }

    fn increase_total_tx_count() {
        TOTAL_TX_COUNT.with(|count| {
            let mut count_mut = count.borrow_mut();
            let prev_count = *count_mut.get();
            count_mut
                .set(prev_count + 1)
                .expect("fail to write total tx count")
        });
    }

    fn read_total_tx_count() -> u64 {
        TOTAL_TX_COUNT.with(|offset| *offset.borrow().get())
    }
}