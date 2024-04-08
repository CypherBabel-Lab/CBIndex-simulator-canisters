import React, { useEffect, useState } from "react";
import { idlFactory } from '../../../declarations/notification/index'
import token from '../../utils/tokenInfo/token.json'
import { Link } from 'react-router-dom'
import dayjs from "dayjs";
import canister_ids from '../../../../.dfx/local/canister_ids.json'
import { localeAmountNumber, localePriceNumber } from '../../utils/number/localeNumber'
function splitString(inputString) {
    let s = inputString.split("-")
    return s[0] + "..." + s[s.length - 1]
}
const FormatTime = (props: any) => {
    const { time, show = true } = props;
    let n = new Date(time / 1e6);
    return (
        <>
            <div>
                {dayjs(n)
                    .locale("en")
                    .format("MMMM D YYYY, HH:mm:ss")
                }
            </div>
        </>
    );

};

const NotificationPage = () => {
    const [notificationList, setNotificationList] = useState([]) //Copy UnCopy Swap Deposit Withdraw  
    const notification = async () => {
        let a = await (window as any).ic.plug.createActor({
            canisterId: canister_ids["notification"].local,
            interfaceFactory: idlFactory,
        });
        let list = []
        a.get_records(BigInt(100), []).then(d => {
            for (let i = 0; i < d.result.length; i++) {
                let tempt = { type: "", key: 0, record: {} as any, time: <></> }
                if (Object.keys(d.result[i].record)[0] === "Unfollowed") {
                    tempt.type = "Unfollowed"
                    tempt.key = Number(d.result[i].id)
                    tempt.time = < FormatTime time={Number(d.result[i].timestamp)} />
                    tempt.record.operator = d.result[i].record.Unfollowed[0].toString()
                    tempt.record.user = d.result[i].record.Unfollowed[0].toString()
                    tempt.record.fund = d.result[i].record.Unfollowed[1].toString()

                }
                if (Object.keys(d.result[i].record)[0] === "Followed") {
                    tempt.type = "Followed"
                    tempt.key = Number(d.result[i].id)
                    tempt.time = <FormatTime time={Number(d.result[i].timestamp)} />
                    tempt.record.operator = d.result[i].record.Followed[0].toString()
                    tempt.record.user = d.result[i].record.Followed[0].toString()
                    tempt.record.fund = d.result[i].record.Followed[1].toString()
                }
                if (Object.keys(d.result[i].record)[0] === "TxRecord") {
                    if (Object.keys(d.result[i].record.TxRecord[1])[0] === "Swap") {
                        tempt.type = "Swap"
                        tempt.key = Number(d.result[i].id)
                        tempt.time = <FormatTime time={Number(d.result[i].timestamp)} />
                        tempt.record.sellToken = d.result[i].record.TxRecord[1].Swap.token0.toString()
                        tempt.record.sellTokenAmount = d.result[i].record.TxRecord[1].Swap.token0_amount
                        tempt.record.buyToken = d.result[i].record.TxRecord[1].Swap.token1.toString()
                        tempt.record.buyTokenAmount = d.result[i].record.TxRecord[1].Swap.token1_amount.toString()
                        tempt.record.operator = d.result[i].record.TxRecord[1].Swap.operator.toString()
                        tempt.record.fund = d.result[i].record.TxRecord[0].toString()
                        tempt.record.usd = d.result[i].record.TxRecord[1].Swap.eq_usd
                    }
                    if (Object.keys(d.result[i].record.TxRecord[1])[0] === "Deposit") {
                        tempt.type = "Deposit"
                        tempt.key = Number(d.result[i].id)
                        tempt.time = <FormatTime time={Number(d.result[i].timestamp)} />
                        tempt.record.fund = d.result[i].record.TxRecord[0].toString()
                        tempt.record.operator = d.result[i].record.TxRecord[1].Deposit.operator.toString()
                        tempt.record.canister_id = d.result[i].record.TxRecord[1].Deposit.canister_id.toString()
                        tempt.record.usd = d.result[i].record.TxRecord[1].Deposit.eq_usd
                    }
                    if (Object.keys(d.result[i].record.TxRecord[1])[0] === "Withdraw") {
                        tempt.type = "Withdraw"
                        tempt.key = Number(d.result[i].id)
                        tempt.time = <FormatTime time={Number(d.result[i].timestamp)} />
                        tempt.record.fund = d.result[i].record.TxRecord[0].toString()
                        tempt.record.operator = d.result[i].record.TxRecord[1].Withdraw.operator.toString()
                        let canisterIds = []
                        let usd = 0
                        for (let j = 0; j < d.result[i].record.TxRecord[1].Withdraw.canister_ids.length; j++) {
                            canisterIds.push(d.result[i].record.TxRecord[1].Withdraw.canister_ids[j].toString())
                            usd = usd + d.result[i].record.TxRecord[1].Withdraw.eq_usds[j]
                        }
                        tempt.record.canister_id = canisterIds
                        tempt.record.usd = usd
                        tempt.record.amounts = d.result[i].record.TxRecord[1].Withdraw.amounts
                    }
                }
                list.push(tempt)
            }
            setNotificationList(list)
        })
    }
    useEffect(() => {
        notification()
    }, [])
    return <div>
        <div style={{
            fontSize: "20px",
            fontWeight: "600",
            color: "#fff",
            marginBottom: "20px"
        }}>
            Notification
        </div>
        {
            notificationList.map((it, index) => {
                return <div key={it.key} style={{
                    display: "flex",
                    fontSize: "14px",
                    color: "rgba(255, 255, 255, 0.85)",
                    cursor: "pointer",
                    borderBottom: "1px solid rgba(253, 253, 253, 0.12)",
                    marginBottom: "25px"
                }}
                >
                    <Link to={"/details?vaultAddress=" + it.record.fund}>
                        <div style={{
                            marginBottom: "16px"
                        }}>
                            {/* Time */}
                            <div>
                                {it.time}
                            </div>
                            {/* Withdraw */}
                            {
                                it.type === "Withdraw" && <>{splitString(it.record.operator)}
                                    <span style={{ marginRight: "6px", marginLeft: "6px" }}>redeemed</span>${localePriceNumber(it.record.usd)} USD from {splitString(it.record.fund)}.
                                </>
                            }
                            {/* Deposit */}
                            {
                                it.type === "Deposit" && <>{splitString(it.record.operator)}
                                    <span style={{ marginRight: "6px", marginLeft: "6px" }}>invested</span> ${localePriceNumber(it.record.usd)} USD in {splitString(it.record.fund)}.
                                </>
                            }
                            {/* Swap */}
                            {
                                it.type === "Swap" && <div>A swap occurred in {splitString(it.record.fund)}.
                                    <span style={{
                                        marginLeft: "6px",
                                        marginRight: "6px"
                                    }}>
                                        Swapped {localeAmountNumber(it.record.sellTokenAmount) + " "}

                                        {token[it.record.sellToken].symbol} for {localeAmountNumber(it.record.buyTokenAmount) + " "}

                                        {token[it.record.buyToken].symbol}
                                    </span>
                                    with a total size of {" $" + localePriceNumber(it.record.usd) + " USD"}.
                                </div>
                            }
                            {/* Unfollowed */}
                            {
                                it.type === "Unfollowed" &&
                                <>
                                    {splitString(it.record.user)} uncopied {splitString(it.record.fund)}.
                                </>
                            }
                            {/* Followed */}
                            {
                                it.type === "Followed" && <>
                                    <div>
                                        {splitString(it.record.user)} copied {splitString(it.record.fund)}.
                                    </div>
                                </>
                            }
                        </div>
                    </Link>
                </div>
            })
        }
    </div >

}

export default NotificationPage