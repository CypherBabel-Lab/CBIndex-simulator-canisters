#!/bin/bash
dfx identity use minter_icp_swap
MINTER_PRINCIPAL=$(dfx identity get-principal)
dfx identity use minter_ckbtc
dfx canister call ckbtc icrc1_transfer "(record {to = record { owner = principal \"$MINTER_PRINCIPAL\"}; amount = 1000000000000000000})"
dfx identity use minter_cketh
dfx canister call cketh icrc1_transfer "(record {to = record { owner = principal \"$MINTER_PRINCIPAL\"}; amount = 1000000000000000000})"
dfx identity use minter_icp_swap
TOTAL_SUPPLY="1000000000000000000"
TRANS_FEE=0;
ckbtcId=`dfx canister id ckbtc`
ckethId=`dfx canister id cketh`
infoId=`dfx canister id base_index`
swapFactoryId=`dfx canister id SwapFactory`
positionIndexId=`dfx canister id PositionIndex`
swapFeeReceiverId=`dfx canister id SwapFeeReceiver`
zeroForOne="true"
echo "==> infoId (\"$infoId\")"
echo "==> positionIndexId (\"$positionIndexId\")"
echo "==> swapFeeReceiverId (\"$swapFeeReceiverId\")"

dfx canister call base_index addClient "(principal \"$swapFactoryId\")"

if [[ "$ckbtcId" < "$ckethId" ]]; then
    token0="$ckbtcId"
    token1="$ckethId"
else
    token0="$ckethId"
    token1="$ckbtcId"
fi
echo "======================================="
echo "=== token0: $token0"
echo "=== token1: $token1"
echo "======================================="
echo 

function balanceOf()
{
    balance=`dfx canister call $1 icrc1_balance_of "(record { owner = principal \"$2\"; })"`
    echo $balance
}

# create pool
function create_pool() #sqrtPriceX96
{
    dfx canister call ICRC2 icrc2_approve "(record{amount=1000000000000;created_at_time=null;expected_allowance=null;expires_at=null;fee=null;from_subaccount=null;memo=null;spender=record {owner= principal \"$(dfx canister id PasscodeManager)\";subaccount=null;}})"
    dfx canister call PasscodeManager depositFrom "(record {amount=100000000;fee=0;})"
    dfx canister call PasscodeManager requestPasscode "(principal \"$token0\", principal \"$token1\", 3000)"
    
    result=`dfx canister call SwapFactory createPool "(record {token0 = record {address = \"$token0\"; standard = \"ICRC2\";}; token1 = record {address = \"$token1\"; standard = \"ICRC2\";}; fee = 3000; sqrtPriceX96 = \"$1\"})"`
    if [[ ! "$result" =~ " ok = record " ]]; then
        echo "\033[31mcreate pool fail. $result - \033[0m"
    fi
    echo "create_pool result: $result"
    poolId=`echo $result | awk -F"canisterId = principal \"" '{print $2}' | awk -F"\";" '{print $1}'`
    dfx canister call $ckbtcId icrc2_approve "(record {spender = record { owner = principal \"$poolId\";};amount = $TOTAL_SUPPLY; })"
    dfx canister call $ckethId icrc2_approve "(record {spender = record { owner = principal \"$poolId\";};amount = $TOTAL_SUPPLY; })"
    #dfx canister call $ckethId approve "(principal \"$poolId\", $TOTAL_SUPPLY)"
    # dfx canister call $poolId getConfigCids
    dfx canister call PositionIndex updatePoolIds 
}

function depost() # token tokenAmount
{   
    echo "=== pool deposit  ==="
    result=`dfx canister call $poolId depositFrom "(record {token = \"$1\"; amount = $2: nat; fee = $TRANS_FEE: nat; })"`
    result=${result//"_"/""}
    if [[ "$result" =~ "$2" ]]; then
      echo "\033[32m deposit $1 success. \033[0m"
    else
      echo "\033[31m deposit $1 fail. $result, $2 \033[0m"
    fi
}

function mint(){ #tickLower tickUpper amount0Desired amount0Min amount1Desired amount1Min ### liquidity tickCurrent sqrtRatioX96
    result=`dfx canister call $poolId mint "(record { token0 = \"$token0\"; token1 = \"$token1\"; fee = 3000: nat; tickLower = $1: int; tickUpper = $2: int; amount0Desired = \"$3\"; amount1Desired = \"$5\"; })"`
    info=`dfx canister call $poolId metadata`
    info=${info//"_"/""}
    if [[ "$info" =~ "$7" ]] && [[ "$info" =~ "$8" ]] && [[ "$info" =~ "$9" ]]; then
      echo "\033[32m mint success. \033[0m"
    else
      echo "\033[31m mint fail. $info \n expected $7 $8 $9 \033[0m"
    fi
    dfx canister call PositionIndex addPoolId "(\"$poolId\")"
}

function swap() #depostToken depostAmount amountIn amountOutMinimum ### liquidity tickCurrent sqrtRatioX96  token0BalanceAmount token1BalanceAmount zeroForOne
{
    echo "=== swap... ==="
    depost $1 $2    
    if [[ "$1" =~ "$token0" ]]; then
        result=`dfx canister call $poolId swap "(record { zeroForOne = true; amountIn = \"$3\"; amountOutMinimum = \"$4\"; })"`
    else
        result=`dfx canister call $poolId swap "(record { zeroForOne = false; amountIn = \"$3\"; amountOutMinimum = \"$4\"; })"`
    fi
    echo "swap result: $result"

    result=`dfx canister call $poolId getUserUnusedBalance "(principal \"$MINTER_PRINCIPAL\")"`
    echo "unused balance result: $result"

    withdrawAmount0=${result#*=}
    withdrawAmount0=${withdrawAmount0#*=}
    withdrawAmount0=${withdrawAmount0%:*}
    withdrawAmount0=${withdrawAmount0//" "/""}
    echo "withdraw amount0: $withdrawAmount0"

    withdrawAmount1=${result##*=}
    withdrawAmount1=${withdrawAmount1%:*}
    withdrawAmount1=${withdrawAmount1//" "/""}
    echo "withdraw amount1: $withdrawAmount1"

    result=`dfx canister call $poolId withdraw "(record {token = \"$token0\"; fee = $TRANS_FEE: nat; amount = $withdrawAmount0: nat;})"`
    echo "token0 withdraw result: $result"
    result=`dfx canister call $poolId withdraw "(record {token = \"$token1\"; fee = $TRANS_FEE: nat; amount = $withdrawAmount1: nat;})"`
    echo "token1 withdraw result: $result"
    
    token0BalanceResult="$(balanceOf $token0 $MINTER_PRINCIPAL)"
    echo "token0 $MINTER_PRINCIPAL balance: $token0BalanceResult"
    token1BalanceResult="$(balanceOf $token1 $MINTER_PRINCIPAL)"
    echo "token1 $MINTER_PRINCIPAL balance: $token1BalanceResult"
    info=`dfx canister call $poolId metadata`
    info=${info//"_"/""}
    token0BalanceResult=${token0BalanceResult//"_"/""}
    token1BalanceResult=${token1BalanceResult//"_"/""}
    if [[ "$info" =~ "$5" ]] && [[ "$info" =~ "$6" ]] && [[ "$info" =~ "$7" ]] && [[ "$token0BalanceResult" =~ "$8" ]] && [[ "$token1BalanceResult" =~ "$9" ]]; then
      echo "\033[32m swap success. \033[0m"
    else
      echo "\033[31m swap fail. $info \n expected $5 $6 $7 $8 $9\033[0m"
    fi
}

function testMintSwap()
{
    echo
    echo test mint process
    echo
    #sqrtPriceX96
    create_pool 274450166607934908532224538203

    echo
    echo "==> step 1 mint"
    depost $token0 100000000000
    depost $token1 1667302813453
    #tickLower tickUpper amount0Desired amount0Min amount1Desired amount1Min ### liquidity tickCurrent sqrtRatioX96
    mint -23040 46080 100000000000 92884678893 1667302813453 1573153132015 529634421680 24850 274450166607934908532224538203

    echo "==> step 2 swap"
    #depostToken depostAmount amountIn amountOutMinimum ### liquidity tickCurrent sqrtRatioX96 token0BalanceAmount token1BalanceAmount
    swap $token0 100000000000 100000000000 658322113914 529634421680 14808 166123716848874888729218662825 999999800000000000 999999056851511853

    echo "==> step 3 swap"
    #depostToken depostAmount amountIn amountOutMinimum ### liquidity tickCurrent sqrtRatioX96 token0BalanceAmount token1BalanceAmount
    swap $token1 200300000000 200300000000 34999517311 529634421680 18116 195996761539654227777570705349 999999838499469043 999998856551511853
}

testMintSwap