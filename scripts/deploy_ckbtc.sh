#!/usr/bin/env bash

dfx identity new minter --storage-mode=plaintext
dfx identity use minter
MINTER=$(dfx identity get-principal)
dfx identity use default
DEFAULT=$(dfx identity get-principal)
TOKEN_NAME="ckbtc"
TOKEN_SYMBOL="CKBTC"
TOKEN_CANISTER_ID="mxzaz-hqaaa-aaaar-qaada-cai"
PRE_MINTED_TOKENS=10_000_000_000
TRANSFER_FEE=10_000
FEATURE_FLAGS=true

dfx identity new archive_controller --storage-mode=plaintext
dfx identity use archive_controller
ARCHIVE_CONTROLLER=$(dfx identity get-principal)
TRIGGER_THRESHOLD=2000
NUM_OF_BLOCK_TO_ARCHIVE=1000
CYCLE_FOR_ARCHIVE_CREATION=10000000000000

dfx deploy --specified-id "${TOKEN_CANISTER_ID}" ckbtc --argument "
  (variant {
    Init = record {
    token_symbol = \"${TOKEN_SYMBOL}\";
     token_name = \"${TOKEN_NAME}\";
     minting_account = record { owner = principal \"${MINTER}\" };
     transfer_fee = ${TRANSFER_FEE};
     metadata = vec {};
     feature_flags = opt record{icrc2 = ${FEATURE_FLAGS}};
     initial_balances = vec { record { record { owner = principal \"${DEFAULT}\"; }; ${PRE_MINTED_TOKENS}; }; };
     archive_options = record {
         num_blocks_to_archive = ${NUM_OF_BLOCK_TO_ARCHIVE};
         trigger_threshold = ${TRIGGER_THRESHOLD};
         controller_id = principal \"${ARCHIVE_CONTROLLER}\";
         cycles_for_archive_creation = opt ${CYCLE_FOR_ARCHIVE_CREATION};
     };
    }
  })
"