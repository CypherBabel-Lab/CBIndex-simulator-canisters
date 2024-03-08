// This is an experimental feature to generate Rust binding from Candid.
// You may want to manually adjust some of the types.
#![allow(dead_code, unused_imports)]
use candid::{self, CandidType, Deserialize, Principal, Encode, Decode};
use ic_cdk::api::call::CallResult as Result;
use ic_exports::ic_cdk;

#[derive(CandidType, Deserialize, Clone)]
pub struct DepositArgs {
  pub fee: candid::Nat,
  pub token: Principal,
  pub amount: candid::Nat,
}

#[derive(CandidType, Deserialize,Debug)]
pub enum Error {
  CommonError,
  InternalError(String),
  UnsupportedToken(String),
  InsufficientFunds,
}

#[derive(CandidType, Deserialize)]
pub enum Result_ {
  #[serde(rename="ok")]
  Ok(candid::Nat),
  #[serde(rename="err")]
  Err(Error),
}

#[derive(CandidType, Deserialize)]
pub enum Result7 {
  #[serde(rename="ok")]
  Ok{ balance0: candid::Nat, balance1: candid::Nat },
  #[serde(rename="err")]
  Err(Error),
}

#[derive(CandidType, Deserialize)]
pub struct SwapArgs {
  pub amountIn: String,
  pub zeroForOne: bool,
  pub amountOutMinimum: String,
}

#[derive(CandidType, Deserialize)]
pub struct WithdrawArgs {
  pub fee: candid::Nat,
  pub token: String,
  pub amount: candid::Nat,
}

// candid::define_service!(pub SwapPool : {
//   "deposit" : candid::func!((DepositArgs) -> (Result_));
//   "depositFrom" : candid::func!((DepositArgs) -> (Result_));
//   "getUserUnusedBalance" : candid::func!((Principal) -> (Result7) query);
//   "quote" : candid::func!((SwapArgs) -> (Result_) query);
//   "swap" : candid::func!((SwapArgs) -> (Result_));
//   "withdraw" : candid::func!((WithdrawArgs) -> (Result_));
// });
pub struct Service(pub Principal);
impl Service {
  pub async fn deposit(&self, arg0: DepositArgs) -> Result<(Result_,)> {
    ic_cdk::call(self.0, "deposit", (arg0,)).await
  }
  pub async fn deposit_from(&self, arg0: DepositArgs) -> Result<(Result_,)> {
    ic_cdk::call(self.0, "depositFrom", (arg0,)).await
  }
  pub async fn get_user_unused_balance(&self, arg0: Principal) -> Result<
    (Result7,)
  > { ic_cdk::call(self.0, "getUserUnusedBalance", (arg0,)).await }
  pub async fn quote(&self, arg0: SwapArgs) -> Result<(Result_,)> {
    ic_cdk::call(self.0, "quote", (arg0,)).await
  }
  pub async fn swap(&self, arg0: SwapArgs) -> Result<(Result_,)> {
    ic_cdk::call(self.0, "swap", (arg0,)).await
  }
  pub async fn withdraw(&self, arg0: WithdrawArgs) -> Result<(Result_,)> {
    ic_cdk::call(self.0, "withdraw", (arg0,)).await
  }
}