use candid::{CandidType, Nat, Principal};
use serde::Deserialize;

#[derive(Deserialize, CandidType, Clone, Debug)]
pub enum Record {
    Deposit(Deposit),
    Withdraw(Withdraw),
    Swap(Swap),
    Lend(Lend),
    Borrow(Borrow),
}

#[derive(Deserialize, CandidType, Clone, Debug)]
pub struct Deposit {
    pub canister_id: Principal,
    pub amount: Nat,
}

#[derive(Deserialize, CandidType, Clone, Debug)]
pub struct Withdraw {
    pub shares_percent: u16,    //  0 - 10000 (0 - 100%)
    pub canister_ids: Vec<Principal>,
    pub weights: Vec<u16>,
}

#[derive(Deserialize, CandidType, Clone, Debug)]
pub struct Swap {

}

#[derive(Deserialize, CandidType, Clone, Debug)]
pub struct Lend {

}

#[derive(Deserialize, CandidType, Clone, Debug)]
pub struct Borrow {

}