import React from "react";
import classes from './style.module.less'
import { Avatar } from "antd"
import shareIcon from '../../public/icon/share.png'
import { Tooltip } from 'antd'
import dayjs from "dayjs";
import token from '../../utils/tokenInfo/token.json'
import { AccountIdentifier } from '@dfinity/ledger-icp';
import { Principal } from '@dfinity/principal';
import { icpswapImg, usdtImg } from './imgBase64'
import { localePriceNumber } from "../../utils/number/localeNumber";
/**
 * @description props time(时间戳), show(是否需要时分秒，默认开启)
 * @returns 格式化后的时间
 */
const FormatTime = (props: any) => {
    const { time, show = true } = props;
    console.log(time);

    if (show) {
        return (
            <>
                <div>
                    {time === "-"
                        ? "-"
                        : dayjs(time)
                            .locale("en")
                            .format("D MMMM YYYY, HH:mm:ss")
                    }
                </div>
            </>
        );
    } else {
        return (
            <>
                <div>
                    {time === "-"
                        ? "-"
                        : dayjs(time)
                            .locale("en")
                            .format("D MMMM YYYY")
                    }
                </div>
            </>
        );
    }
};
const ShareImg = ({ onClick }) => {
    return <img src={shareIcon} width={15} height={15} alt="Block"
        style={{
            marginLeft: "5px",
            cursor: "pointer",
        }}
        onClick={() => {
            console.log('123');
            onClick()
        }}
    />
}
export function splitString(inputString) {
    let s = inputString.split("-")
    return s[0] + "..." + s[s.length - 1]
}
const ActivityTable = ({ activityList, vaultInfo }: any) => {
    console.log(activityList);
    const toolTipText = (canister_ids, amounts, eq_usds) => {
        let text = canister_ids.map((item: any, index) => {
            return <div style={{
                display: "flex",
                alignItems: "center",
                minWidth: "300px"
            }}
                key={item}
            >
                <div>
                    {token[item].symbol}
                </div>
                <div style={{
                    display: "flex",
                    alignItems: "center",
                }}>
                    <img width={16} height={16}
                        style={{
                            marginLeft: "4px",
                            marginRight: "4px"
                        }}
                        src={token[item].icon} alt=""
                    />
                </div>
                <div>{amounts[index].toFixed(6)} (${Number(eq_usds[index].toFixed(2)).toLocaleString()} USD)</div>
            </div >
        })
        return text
    }
    return <>
        <div>
            {activityList.map((item: any) => {
                return <div key={item.id}>
                    <div className={classes.activeCardBox}>
                        <div className={classes.left}>
                            <div className={classes.leftTop}>
                                <div className={classes.leftItemBox} >
                                    <FormatTime time={item.timestamp} />

                                </div>

                                {/* Type */}
                                <div className={classes.actionType}>
                                    {item.operation}
                                </div>
                            </div>
                            <div className={classes.leftBottom}>
                                <div>
                                    {vaultInfo.name}
                                </div>
                            </div>
                        </div>
                        {item.operation === "Swap" &&
                            <div className={classes.right}>
                                {/* outgoingAsset */}
                                <div className={classes.rightItem}>
                                    <div>
                                        Protocol
                                    </div>
                                    <div className={classes.cardRightInfo}>
                                        ICPSwap
                                    </div>
                                </div>
                                {/* outgoingAsset */}
                                <div className={classes.rightItem}>
                                    <div>
                                        Outgoing Asset

                                    </div>
                                    <div className={classes.cardRightInfo}>
                                        {Number(item.outgoingAssetAmount).toFixed(6)}  {token[item.outgoingCanisterId].symbol}    <Avatar className={classes.avatar} src={token[item.outgoingCanisterId].icon} />
                                    </div>
                                </div>
                                {/*incomingAsset*/}
                                <div className={classes.rightItem}>
                                    <div>
                                        Shares Received
                                    </div>
                                    <div>
                                        {Number(item.incomingAssetAmount).toFixed(6)} {token[item.incomingCanisterId].symbol} <Avatar className={classes.avatar} src={token[item.incomingCanisterId].icon} />
                                    </div>
                                </div>
                                {/* Depositor  */}
                                <div className={classes.rightItem}>
                                    <div>
                                        Depositor
                                    </div>
                                    <div>
                                        {splitString(item.operator)}
                                        <ShareImg
                                            onClick={() => {
                                                window.open("https://dashboard.internetcomputer.org/account/" + AccountIdentifier.fromPrincipal({ principal: Principal.fromText(item.operator) }).toHex())
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        }
                        {item.operation === "Withdraw" && <div className={classes.right}>
                            {/* outgoingAsset */}
                            <div className={classes.rightItem}>
                                <div>
                                    Amount
                                </div>
                                <div className={classes.cardRightInfo}>
                                    <Tooltip placement="top" trigger={"click"} title={toolTipText(item.canister_ids, item.amounts, item.eq_usds)}>
                                        <div style={{
                                            display: "flex",
                                            alignItems: "center"
                                        }}>
                                            ${localePriceNumber(item.usds)}
                                            <span style={{
                                                marginLeft: "5px"
                                            }}>
                                                {"USD"}
                                            </span>
                                            {/* <Avatar className={classes.avatar}
                                                src={usdtImg}
                                            /> */}
                                        </div>
                                    </Tooltip>
                                </div>
                            </div>
                            {/*incomingAsset*/}
                            <div className={classes.rightItem}>
                                <div>
                                    {item.operation === "Withdraw" ? "Shares Redeemed" : "Shares  Received"}
                                </div>
                                <div className={classes.cardRightInfo}>
                                    {item.shares_num.toFixed(6)}
                                </div>
                            </div>
                            {/*Depositor  */}
                            <div className={classes.rightItem}>
                                <div>
                                    Operator
                                </div>
                                <div className={classes.cardRightInfo}>
                                    {splitString(item.operator)}
                                    <ShareImg
                                        onClick={() => {
                                            window.open("https://dashboard.internetcomputer.org/account/" + AccountIdentifier.fromPrincipal({ principal: Principal.fromText(item.operator) }).toHex())
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                        }
                        {item.operation === "Deposit" && <div className={classes.right}>
                            {/* outgoingAsset */}
                            <div className={classes.rightItem}>
                                <div>
                                    Amount
                                </div>
                                <div className={classes.cardRightInfo}>
                                    {item.amount.toFixed(6)}
                                    <span style={{
                                        marginLeft: "5px"
                                    }}> {token[item.canister[0]].symbol}</span>
                                    <Avatar className={classes.avatar} src={token[item.canister[0]].icon} />
                                </div>
                            </div>
                            {/*incomingAsset*/}
                            <div className={classes.rightItem}>
                                <div>
                                    {item.operation === "Redemption" ? "Shares Redeemed" : "Shares  Received"}
                                </div>
                                <div className={classes.cardRightInfo}>
                                    {item.sharesReceived.toFixed(6)}
                                </div>
                            </div>
                            {/*Depositor  */}
                            <div className={classes.rightItem}>
                                <div>
                                    Operator
                                </div>
                                <div className={classes.cardRightInfo}>
                                    {splitString(item.operator)}
                                    <ShareImg
                                        onClick={() => {
                                            window.open("https://dashboard.internetcomputer.org/account/" + AccountIdentifier.fromPrincipal({ principal: Principal.fromText(item.operator) }).toHex())
                                        }}
                                    />
                                </div>
                            </div>
                        </div>}
                    </div>
                </div>
            })
            }
        </div>
    </>
}

export default ActivityTable;