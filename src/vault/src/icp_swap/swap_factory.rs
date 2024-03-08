// This is an experimental feature to generate Rust binding from Candid.
// You may want to manually adjust some of the types.
#![allow(dead_code, unused_imports)]
use candid::{self, CandidType, Deserialize, Principal, Encode, Decode};
use ic_cdk::api::call::CallResult as Result;
use ic_exports::ic_cdk;

#[derive(CandidType, Deserialize)]
pub struct Token { pub address: String, pub standard: String }

#[derive(CandidType, Deserialize)]
pub struct GetPoolArgs {
  pub fee: candid::Nat,
  pub token0: Token,
  pub token1: Token,
}

#[derive(CandidType, Deserialize)]
pub struct PoolData {
  pub fee: candid::Nat,
  pub key: String,
  pub tickSpacing: candid::Int,
  pub token0: Token,
  pub token1: Token,
  pub canisterId: Principal,
}

#[derive(CandidType, Deserialize)]
pub enum Error {
  CommonError,
  InternalError(String),
  UnsupportedToken(String),
  InsufficientFunds,
}

#[derive(CandidType, Deserialize)]
pub enum Result3 {
  #[serde(rename="ok")]
  Ok(PoolData),
  #[serde(rename="err")]
  Err(Error),
}

#[derive(CandidType, Deserialize)]
pub enum Result2 {
  #[serde(rename="ok")]
  Ok(Vec<PoolData>),
  #[serde(rename="err")]
  Err(Error),
}

// candid::define_service!(pub SwapFactory : {
//   "getPool" : candid::func!((GetPoolArgs) -> (Result3) query);
//   "getPools" : candid::func!(() -> (Result2) query);
// });
pub struct Service(pub Principal);
impl Service {
  pub async fn get_pool(&self, arg0: GetPoolArgs) -> Result<(Result3,)> {
    ic_cdk::call(self.0, "getPool", (arg0,)).await
  }
  pub async fn get_pools(&self) -> Result<(Result2,)> {
    ic_cdk::call(self.0, "getPools", ()).await
  }
}