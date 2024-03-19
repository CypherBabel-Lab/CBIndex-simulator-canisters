#!/bin/bash
source ./scripts/build.sh
dfx stop
dfx start --background --clean
echo "--------------------Deploying the icp ledger canister-----------------------------"
source ./scripts/deploy_icp_ledger.sh
echo "--------------------Deploying the ckbtc canister-----------------------------"
source ./scripts/deploy_ckbtc.sh
echo "--------------------Deploying the cketh canister-----------------------------"
source ./scripts/deploy_cketh.sh
echo "==>-----------------Install icp-swap canisters-------------------"
source ./scripts/deploy_icp_swap.sh
echo "--------------------Deploying the cmc canister---------------------------------"
source ./scripts/deploy_cmc.sh
echo "--------------------Deploying the xrc canister---------------------------------"
source ./scripts/deploy_xrc.sh
echo "--------------------Deploying the vault factory canister-------------------------"
source ./scripts/deploy_vault_factory.sh