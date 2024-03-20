#!/bin/bash
echo "==> Deploying the local environment"
source ./scripts/deploy.sh
echo "==> Create a new pool"
source ./scripts/test_create_icp_swap_pool.sh
echo "==> Create a new vault"
source ./scripts/test_create_vault.sh
echo "==> Deposit ckbtc(local) to the vault"

VAULT_CANISTER_ID="ahw5u-keaaa-aaaaa-qaaha-cai"
VAULT_SHARES_TOKEN_CANISTER_ID="aax3a-h4aaa-aaaaa-qaahq-cai"
CKBTC_CANISTER_ID="mxzaz-hqaaa-aaaar-qaada-cai"
CKETH_CANISTER_ID="ss2fx-dyaaa-aaaar-qacoq-cai"
ICP_CANISTER_ID="ryjl3-tyaaa-aaaaa-aaaba-cai"

dfx identity use vault_creator
dfx canister call $VAULT_CANISTER_ID set_shares_token "(principal \"$VAULT_SHARES_TOKEN_CANISTER_ID\")"

dfx canister call $VAULT_CANISTER_ID get_config

dfx identity use default
INVESTOR=$(dfx identity get-principal)

echo "--------------check vault aum and nav---------------------"
dfx canister call $VAULT_CANISTER_ID get_aum
dfx canister call $VAULT_CANISTER_ID get_nav

DEPOSIT_CKBTC_AMOUNT=100000000
SWAP_CKBTC_AMOUNT=50000000

echo "--------------approve vault canister ckbtc---------------------"
dfx canister call $CKBTC_CANISTER_ID icrc1_balance_of "(record { owner = principal \"$INVESTOR\"; })"
dfx canister call $CKBTC_CANISTER_ID icrc2_approve "(record {spender = record { owner = principal \"$VAULT_CANISTER_ID\";};amount = $DEPOSIT_CKBTC_AMOUNT; })"
dfx canister call $CKBTC_CANISTER_ID icrc2_allowance "(record {account = record { owner = principal \"$INVESTOR\";}; spender = record { owner = principal \"$VAULT_CANISTER_ID\";} })"
dfx canister call $VAULT_CANISTER_ID deposit "(principal \"$CKBTC_CANISTER_ID\", $DEPOSIT_CKBTC_AMOUNT : nat)"
echo "--------------investor ckbtc balance-----------------"
dfx canister call $CKBTC_CANISTER_ID icrc1_balance_of "(record { owner = principal \"$INVESTOR\"; })"
echo "--------------investor shares token balance-------------"
dfx canister call --query $VAULT_SHARES_TOKEN_CANISTER_ID icrc1_balance_of "(record { owner = principal \"$INVESTOR\"; })"
echo "--------------check vault aum and nav---------------------"
dfx canister call $VAULT_CANISTER_ID get_aum
dfx canister call $VAULT_CANISTER_ID get_nav
echo "==> Swap ckbtc(local) to cketh(local) in the vault"
echo "--------------check vault assets---------------------"
dfx canister call $VAULT_CANISTER_ID get_ledger
echo "--------------apove vault ckbtc to pool---------------------"
echo "--------------test normal account can not operation---------------------"
dfx canister call $VAULT_CANISTER_ID approve "(principal \"$poolId\", principal \"$CKBTC_CANISTER_ID\", $SWAP_CKBTC_AMOUNT : nat)"
echo "--------------change to vault creator account---------------------"
dfx identity use vault_creator
echo "-------------step 1: approve vault ckbtc to pool---------------------"
dfx canister call $VAULT_CANISTER_ID approve "(principal \"$poolId\", principal \"$CKBTC_CANISTER_ID\", $SWAP_CKBTC_AMOUNT : nat)"
echo "-------------step 2: deposit ckbtc to pool---------------------"
dfx canister call $VAULT_CANISTER_ID deposit_from "(principal \"$poolId\", record {token = \"$CKBTC_CANISTER_ID\"; amount = $SWAP_CKBTC_AMOUNT: nat; fee = 0: nat; })"
echo "-------------step 3: swap ckbtc to cketh---------------------"
dfx canister call $VAULT_CANISTER_ID swap "(principal \"$poolId\", principal \"$CKBTC_CANISTER_ID\", principal \"$CKETH_CANISTER_ID\", record { zeroForOne = true; amountIn = \"$SWAP_CKBTC_AMOUNT\"; amountOutMinimum = \"0\"; })"
echo "--------------step 4: withdraw cketh from pool---------------------"
result=`dfx canister call $poolId getUserUnusedBalance "(principal \"$VAULT_CANISTER_ID\")"`
echo "unused balance result: $result"
withdrawAmount1=${result##*=}
withdrawAmount1=${withdrawAmount1%:*}
withdrawAmount1=${withdrawAmount1//" "/""}
echo "withdraw amount1: $withdrawAmount1"
dfx canister call $VAULT_CANISTER_ID withdraw_from "(principal \"$poolId\", record {token = \"$CKETH_CANISTER_ID\"; amount = $withdrawAmount1: nat; fee = 0: nat; })"
echo "--------------check vault assets---------------------"
dfx canister call $VAULT_CANISTER_ID get_ledger
dfx canister call $VAULT_CANISTER_ID get_aum
dfx stop

