use candid::CandidType;
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

}

#[derive(Deserialize, CandidType, Clone, Debug)]
pub struct Withdraw {

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