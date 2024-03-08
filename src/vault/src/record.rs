use candid::{CandidType, Principal};
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
    pub amount: f64,
    pub shares_num: f64,
    pub eq_usd: f64,
}

#[derive(Deserialize, CandidType, Clone, Debug)]
pub struct Withdraw {
    pub shares_nums: f64,  //  0 - 10000 (0 - 100%)
    pub canister_ids: Vec<Principal>,
    pub amounts: Vec<f64>,
    pub eq_usds: Vec<f64>,
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