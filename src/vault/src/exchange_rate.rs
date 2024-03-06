use candid::Principal;
use ic_exports::candid::{CandidType, Deserialize};
use ic_exports::{
  ic_cdk::api::call::call_with_payment,
  ic_cdk::api::call::CallResult as Result,
};

pub struct Service(pub Principal);

impl Service {
  pub fn new(principal: Principal) -> Self {
    Self(principal)
  }
  
  pub async fn get_exchange_rate(&self, arg0: GetExchangeRateRequest) -> Result<
    (GetExchangeRateResult,)
  > { call_with_payment(self.0, "get_exchange_rate", (arg0,), 1000000000).await }
}

#[derive(CandidType, Deserialize, Debug)]
pub enum AssetClass {
     Cryptocurrency, 
     FiatCurrency,
}

#[derive(CandidType, Deserialize, Debug)]
pub struct Asset { 
    pub class: AssetClass, 
    pub symbol: String,
}

#[derive(CandidType, Deserialize)]
pub struct GetExchangeRateRequest {
  pub timestamp: Option<u64>,
  pub quote_asset: Asset,
  pub base_asset: Asset,
}

#[derive(CandidType, Deserialize, Debug)]
pub struct ExchangeRateMetadata {
  pub decimals: u32,
  pub forex_timestamp: Option<u64>,
  pub quote_asset_num_received_rates: u64,
  pub base_asset_num_received_rates: u64,
  pub base_asset_num_queried_sources: u64,
  pub standard_deviation: u64,
  pub quote_asset_num_queried_sources: u64,
}

#[derive(CandidType, Deserialize, Debug)]
pub struct ExchangeRate {
  pub metadata: ExchangeRateMetadata,
  pub rate: u64,
  pub timestamp: u64,
  pub quote_asset: Asset,
  pub base_asset: Asset,
}

#[derive(CandidType, Deserialize, Debug)]
pub enum ExchangeRateError {
  AnonymousPrincipalNotAllowed,
  CryptoQuoteAssetNotFound,
  FailedToAcceptCycles,
  ForexBaseAssetNotFound,
  CryptoBaseAssetNotFound,
  StablecoinRateTooFewRates,
  ForexAssetsNotFound,
  InconsistentRatesReceived,
  RateLimited,
  StablecoinRateZeroRate,
  Other{ code: u32, description: String },
  ForexInvalidTimestamp,
  NotEnoughCycles,
  ForexQuoteAssetNotFound,
  StablecoinRateNotFound,
  Pending,
}

#[derive(CandidType, Deserialize)]
pub enum GetExchangeRateResult {
    Ok(ExchangeRate),
    Err(ExchangeRateError),
}