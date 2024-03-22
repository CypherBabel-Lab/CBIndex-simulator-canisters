// This is an experimental feature to generate Rust binding from Candid.
// You may want to manually adjust some of the types.
#![allow(dead_code, unused_imports)]
use candid::{self, CandidType, Deserialize, Principal, Encode, Decode};
use ic_cdk::api::call::CallResult as Result;
use ic_exports::ic_cdk;
use crate::record::{Record,Withdraw,Swap,Deposit};

#[derive(CandidType, Deserialize, Debug)]
pub enum NotificationError { NotController, NotWhitelist }

#[derive(CandidType, Deserialize, Debug)]
pub enum Result_ { Ok, Err(NotificationError) }

#[derive(CandidType, Deserialize)]
pub struct MetricsData {
  pub stable_memory_size: u64,
  pub cycles: u64,
  pub heap_memory_size: u64,
}

#[derive(CandidType, Deserialize)]
pub enum Interval {
  PerHour,
  PerWeek,
  PerDay,
  Period{ seconds: u64 },
  PerMinute,
}

#[derive(CandidType, Deserialize)]
pub struct MetricsMap {
  pub map: Vec<(u64,MetricsData,)>,
  pub interval: Interval,
  pub history_length_nanos: u64,
}

#[derive(CandidType, Deserialize)]
pub struct MetricsStorage { pub metrics: MetricsMap }


#[derive(CandidType, Deserialize)]
pub enum Notification {
  Followed(Principal),
  TxRecord(Principal,Record,),
  Unfollowed(Principal),
}

#[derive(CandidType, Deserialize)]
pub struct NotificationRecord {
  pub id: u64,
  pub timestamp: u64,
  pub record: Notification,
}

#[derive(CandidType, Deserialize)]
pub struct PaginatedResult {
  pub result: Vec<NotificationRecord>,
  pub next: Option<u64>,
}

pub struct Service(pub Principal);
impl Service {
  pub async fn add_notification_deposit(
    &self,
    arg0: Vec<Principal>,
    arg1: Deposit,
  ) -> Result<(Result_,)> {
    ic_cdk::call(self.0, "add_notification_deposit", (arg0,arg1,)).await
  }
  pub async fn add_notification_followed(&self, arg0: Principal, arg1: Principal) -> Result<
    (Result_,)
  > { ic_cdk::call(self.0, "add_notification_followed", (arg0,arg1,)).await }
  pub async fn add_notification_swap(
    &self,
    arg0: Vec<Principal>,
    arg1: Swap,
  ) -> Result<(Result_,)> {
    ic_cdk::call(self.0, "add_notification_swap", (arg0,arg1,)).await
  }
  pub async fn add_notification_unfollowed(&self, arg0: Principal, arg1: Principal) -> Result<
    (Result_,)
  > { ic_cdk::call(self.0, "add_notification_unfollowed", (arg0,arg1,)).await }
  pub async fn add_notification_withdraw(
    &self,
    arg0: Vec<Principal>,
    arg1: Withdraw,
  ) -> Result<(Result_,)> {
    ic_cdk::call(self.0, "add_notification_withdraw", (arg0,arg1,)).await
  }
  pub async fn add_whitelist(&self, arg0: Principal) -> Result<(Result_,)> {
    ic_cdk::call(self.0, "add_whitelist", (arg0,)).await
  }
  pub async fn get_curr_metrics(&self) -> Result<(MetricsData,)> {
    ic_cdk::call(self.0, "get_curr_metrics", ()).await
  }
  pub async fn get_metrics(&self) -> Result<(MetricsStorage,)> {
    ic_cdk::call(self.0, "get_metrics", ()).await
  }
  pub async fn get_records(&self, arg0: u64, arg1: Option<u64>) -> Result<
    (PaginatedResult,)
  > { ic_cdk::call(self.0, "get_records", (arg0,arg1,)).await }
  pub async fn pkg_version(&self) -> Result<(String,)> {
    ic_cdk::call(self.0, "pkg_version", ()).await
  }
}