#!/usr/bin/env bash

dfx identity use default

VAULT_FACTORY=$(dfx canister id vault_factory)

dfx deploy notification --argument "(principal \"$VAULT_FACTORY\")"