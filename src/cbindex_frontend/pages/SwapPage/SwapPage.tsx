import React, { useState } from "react";
import Swap from '../../components/Swap/Swap'
const priceMap = {
    a1: 0.5,
    b1: 1,
    c1: 2,
    d1: 4,
}
export type SwapStatus = 'swap' | 'loading' | 'success' | 'error' | ""
const SwapPage = () => {
    let supportSellList = [{ name: "a1", symbol: "A" }, { name: "b1", symbol: "B" }, { name: "c1", symbol: "C" }, { name: "d1", symbol: "D" }]
    let supportBuyList = [{ name: "a1", symbol: "A" }, { name: "b1", symbol: "B" }, { name: "c1", symbol: "C" }, { name: "d1", symbol: "D" }]
    const [sellAmount, setSellAmount] = useState(0)
    const [buyAmount, setBuyAmount] = useState(0)
    const [confirmReturnStatus, setConfirmReturnStatus] = useState("swap" as SwapStatus)
    const confirmTransactionEvt = (sellToken, buyToken, sellAmount) => {
        console.log("确认交易", sellToken, buyToken, sellAmount);
        setConfirmReturnStatus("loading")
        setTimeout(() => {
            setConfirmReturnStatus("success")
        }, 2000)
    }
    
    const calculatePriceFuc = (sellToken, buyToken, changeAmount, changeType): number => {
        if (changeType === 'sell') {
            return changeAmount * priceMap[sellToken] / priceMap[buyToken]
        } else {
            return changeAmount * priceMap[buyToken] / priceMap[sellToken]
        }
    }

    const returnList = {
        swap: <Swap
            supportSellList={supportSellList}
            supportBuyList={supportBuyList}
            userHoldList={[]}
            confirmTransactionEvt={confirmTransactionEvt}
            calculatePriceFuc={calculatePriceFuc}
        />,
        loading: <>Loading</>,
        success: <>Success</>,
        error: <>Error</>
    }

    return <>
        {
            returnList[confirmReturnStatus]
        }
    </>
}
export default SwapPage