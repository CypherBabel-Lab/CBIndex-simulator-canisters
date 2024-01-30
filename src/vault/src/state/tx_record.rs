use crate::record::Record;

pub struct TxRecord {
    pub id: u64,
    pub record: Record,
    pub timestamp: u64,
}