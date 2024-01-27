#!/bin/bash
source ./scripts/build.sh
dfx stop
dfx start --background --clean
echo "--------------------Deploying the icp ledger canister-----------------------------"
source ./scripts/deploy_icp_ledger.sh
echo "--------------------Deploying the cmc canister---------------------------------"
source ./scripts/deploy_cmc.sh
echo "--------------------Deploying the vault factory canister-------------------------"
source ./scripts/deploy_vault_factory.sh