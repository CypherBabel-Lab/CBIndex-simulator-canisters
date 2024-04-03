import React, { useEffect, useRef, useState } from "react";
import Swap from '../../components/Swap/Swap'
import { useCanister } from "@connect2ic/react";
import { createActor as getQuoteCreateActor } from '../../../declarations/SwapPool'
import { SwapArgs } from "src/declarations/SwapPool/SwapPool.did";
import { Principal } from '@dfinity/principal';
import { Modal, Spin } from "antd";
let supportSellList = [{ name: "BTC", symbol: "BTC", canisterId: "mxzaz-hqaaa-aaaar-qaada-cai" }, { name: "ETH", symbol: "ETH", canisterId: "ss2fx-dyaaa-aaaar-qacoq-cai" }, { name: "ICP", symbol: "ICP", canisterId: "ryjl3-tyaaa-aaaaa-aaaba-cai" }]
let supportBuyList = [{ name: "BTC", symbol: "BTC", canisterId: "mxzaz-hqaaa-aaaar-qaada-cai" }, { name: "ETH", symbol: "ETH", canisterId: "ss2fx-dyaaa-aaaar-qacoq-cai" }, { name: "ICP", symbol: "ICP", canisterId: "ryjl3-tyaaa-aaaaa-aaaba-cai" }]
export type SwapStatus = 'swap' | 'loading' | 'success' | 'error' | ""
const SwapPage = ({ vaultActor, getVaultList, vaultSwapAsstes, setSwapModalOpen, swapModalOpen }) => {
    // let 
    const [SwapFactory] = useCanister("SwapFactory")
    const [icrc_ledger] = useCanister("icp_ledger_canister")
    const [ckbtc_ledger] = useCanister("ckbtc_ledger_canister")
    const [cketh_ledger] = useCanister("cketh_ledger_canister")
    const [confirmReturnStatus, setConfirmReturnStatus] = useState("swap" as SwapStatus)
    const swapPoolAddress = useRef(null)

    const confirmTransactionEvt = async (sellToken, buyToken, sellBuyAmount) => {
        setConfirmReturnStatus("loading")
        console.log(sellToken, buyToken);
        let feeAmount = 0
        await ckbtc_ledger.icrc1_fee().then(d => {
            feeAmount = Number(d) * sellBuyAmount.sell / 100000000
        })
        await vaultActor.approve(Principal.fromText(swapPoolAddress.current.canisterId), Principal.fromText(sellToken.canisterId), BigInt((Number(sellBuyAmount.sell) + feeAmount) * 100000000)).then(d => {
            // console.log("approve=", d);

        })
        await vaultActor.deposit_from(Principal.fromText(swapPoolAddress.current.canisterId), {
            fee: BigInt(0 * 100000000),
            token: sellToken.canisterId,
            amount: BigInt(Number(sellBuyAmount.sell * 100000000)),
        }).then(d => {
            // console.log("deposit_from=", d);
        })

        await vaultActor.swap(
            Principal.fromText(swapPoolAddress.current.canisterId),
            Principal.fromText(sellToken.canisterId),
            Principal.fromText(buyToken.canisterId), {
            'amountIn': String(sellBuyAmount.sell * 100000000),
            'zeroForOne': sellToken.canisterId < buyToken.canisterId,
            'amountOutMinimum': "0",
        }).then(d => {
            console.log("swap=", d);
            if (!d.Ok) {
                setConfirmReturnStatus("error")
                return
            }
            vaultActor.withdraw_from(Principal.fromText(swapPoolAddress.current.canisterId), {
                fee: BigInt(0 * 100000000),
                token: buyToken.canisterId,
                amount: Number(d.Ok.token1_amount * 100000000),
            }).then(d => {
                console.log(d);
                getVaultList()
                setConfirmReturnStatus("success")
            })
        }).catch(e => {
            console.log(e);
        })
    }
    const searchingPool = async (sell, buy, amount, changeType) => {
        let poolAddress = await SwapFactory.getPool({
            token0: { address: sell, standard: "ICRC2" }, //btc
            token1: { address: buy, standard: "ICRC2" }, // eth
            fee: BigInt(3000)
        }) as any
        swapPoolAddress.current = { canisterId: poolAddress.ok.canisterId.toString(), fee: Number(poolAddress.ok.fee) }
        let qoute = getQuoteCreateActor(swapPoolAddress.current.canisterId)
        let obj: SwapArgs = {
            amountIn: String(amount * 100000000),
            zeroForOne: sell < buy,
            amountOutMinimum: "0"
        }
        let num = await qoute.quote(obj) as any
        return Number(num.ok) / 100000000
    }
    const calculatePriceFuc = async (sellToken, buyToken, changeAmount, changeType): Promise<any> => {
        return searchingPool(sellToken.canisterId, buyToken.canisterId, changeAmount, changeType)
    }
    useEffect(() => {
        return () => {
            console.log('123');
        }
    }, [])
    const returnList = {
        swap: <div>
            <div style={{
                fontWeight: "bold",
                width: "400px",
                margin: "auto"
            }}>
                Swap
            </div>
            <div style={{
                width: "400px",
                // height: "400px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "auto",
                marginTop: "12px"
            }}>
                <Swap
                    supportSellList={supportSellList}
                    supportBuyList={supportBuyList}
                    userHoldList={[]}
                    confirmTransactionEvt={confirmTransactionEvt}
                    calculatePriceFuc={calculatePriceFuc}
                    vaultSwapAsstes={vaultSwapAsstes}
                />
            </div>
        </div>,
        loading: <div style={{
            width: "400px",
            height: "400px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "auto",
        }}>
            <Spin></Spin>
        </div >,
        success: <>Swap successful!</>,
        error: <>Error</>
    }

    return <>

        <Modal open={swapModalOpen}
            okButtonProps={{
                style: {
                    display: "none"
                }
            }}
            cancelButtonProps={{
                style: {
                    display: "none"
                }
            }}
            closeIcon={confirmReturnStatus !== "loading"}
            onCancel={() => {
                console.log(confirmReturnStatus);

                setConfirmReturnStatus("swap")
                setSwapModalOpen(false)
            }}
        >
            {
                returnList[confirmReturnStatus]
            }
            {/* <SwapPage vaultActor={vault.current} getVaultList={getVaultList} vaultSwapAsstes={vaultSwapAsstes} /> */}
        </Modal>

    </>
}
export default SwapPage