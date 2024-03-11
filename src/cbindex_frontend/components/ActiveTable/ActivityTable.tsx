import React from "react";
import classes from './style.module.less'
import { Avatar } from "antd"
import shareIcon from '../../public/icon/share.png'
import { Tooltip } from 'antd'
import dayjs from "dayjs";
import token from '../../utils/tokenInfo/token.json'
/**
 * @description props time(时间戳), show(是否需要时分秒，默认开启)
 * @returns 格式化后的时间
 */
const FormatTime = (props: any) => {
    const { time, show = true } = props;
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
const usdtImg = 'data:image/png;base64,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'
const ShareImg = ({ onClick }) => {
    return <img src={shareIcon} width={15} height={15} alt="Block"
        style={{
            marginLeft: "5px",
            cursor: "pointer",
        }}
        onClick={() => {
            onClick()
        }}
    />
}
export function splitString(inputString) {
    if (inputString.length < 10) {
        // 如果输入的字符串长度不足10个字符，你可能需要进行错误处理或者返回原始字符串
        return inputString;
    }
    const frontPart = inputString.slice(0, 6);
    const backPart = inputString.slice(-4);
    return `${frontPart}...${backPart}`;
}
const ActivityTable = ({ activityList, vaultInfo }: any) => {
    const toolTipText = (canister_ids, amounts, eq_usds) => {
        let text = canister_ids.map((item: any, index) => {
            return <div style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center"
            }}>
                {token[item].symbol}<img width={16} height={16}
                    style={{
                        marginLeft: "4px",
                        marginRight: "10px"
                    }}
                    src={token[item].icon} alt="" />Amount:{amounts[index].toFixed(2)}(${eq_usds[index].toFixed(2)})
            </div>
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
                                    {/* <ShareImg
                                        onClick={() => {
                                            window.open(`${JSON.parse(localStorage.getItem("chainInfo") as any).chainConf.blockExplorer}address/${item.detail.depositor}`)
                                        }}
                                    /> */}
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
                                {/* <div className={classes.leftItemBox} >
                                    {vaultInfo.vaultAddress}123 <img src={shareIcon} width={15} height={15} alt="Block"
                                        style={{
                                            marginLeft: "5px",
                                            cursor: "pointer",
                                        }}
                                        onClick={() => {
                                            window.open(`${JSON.parse(localStorage.getItem("chainInfo") as any).chainConf.blockExplorer}address/${vaultInfo.vaultAddress}`)
                                        }}
                                    />
                                </div> */}
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
                                        Uniswap V2 <Avatar className={classes.avatar} src={``} />
                                    </div>
                                </div>
                                {/* outgoingAsset */}
                                <div className={classes.rightItem}>
                                    <div>
                                        Outgoing Asset

                                    </div>
                                    <div className={classes.cardRightInfo}>
                                        {Number(item.detail.outgoingAssetAmount).toFixed(8)}  {item.detail.outgoingAsset.symbol}    <Avatar className={classes.avatar} src={``} />
                                    </div>
                                </div>
                                {/*incomingAsset*/}
                                <div className={classes.rightItem}>
                                    <div>
                                        Shares Received
                                    </div>
                                    <div>
                                        {Number(item.detail.incomingAssetAmount).toFixed(2)} {item.detail.incomingAsset.symbol} <Avatar className={classes.avatar} src={``} />
                                    </div>
                                </div>
                                {/* Depositor  */}
                                <div className={classes.rightItem}>
                                    <div>
                                        Depositor
                                    </div>
                                    <div>
                                        {/* {splitString(item.detail.caller)} */}
                                        <ShareImg
                                            onClick={() => {
                                                window.open(`${JSON.parse(localStorage.getItem("chainInfo") as any).chainConf.blockExplorer}address/${item.detail.depositor}`)
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
                                    <Tooltip placement="topLeft" title={toolTipText(item.canister_ids, item.amounts, item.eq_usds)}>
                                        <div style={{
                                            display: "flex",
                                            alignItems: "center"
                                        }}>
                                            {item.usds}
                                            <span style={{
                                                marginLeft: "5px"
                                            }}>
                                                {"USD"}
                                            </span> <Avatar className={classes.avatar}
                                                src={usdtImg}
                                            />
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
                                    {item.shares_num}
                                </div>
                            </div>
                            {/*Depositor  */}
                            {/* <div className={classes.rightItem}>
                                <div>
                                    Operator
                                </div>
                                <div className={classes.cardRightInfo}>
                                    123
                                    <ShareImg
                                        onClick={() => {
                                            window.open(`${JSON.parse(localStorage.getItem("chainInfo") as any).chainConf.blockExplorer}address/${item.detail.depositor}`)
                                        }}
                                    />
                                </div>
                            </div> */}
                        </div>
                        }
                        {item.operation === "Deposit" && <div className={classes.right}>
                            {/* outgoingAsset */}
                            <div className={classes.rightItem}>
                                <div>
                                    Amount
                                </div>
                                <div className={classes.cardRightInfo}>
                                    {item.amount.toFixed(8)}
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
                                    {item.sharesReceived}
                                    {/* {item.sharesReceived ? Number(item.detail.sharesReceived).toFixed(2) : Number(item.detail.sharesRedeemed).toFixed(2)}  <img alt="icon" className={classes.avatar} src={cbiLogo} /> */}
                                </div>
                            </div>
                            {/*Depositor  */}
                            {/* <div className={classes.rightItem}>
                                <div>
                                    Operator
                                </div>
                                <div className={classes.cardRightInfo}>
                                    <ShareImg
                                        onClick={() => {
                                            window.open(`${JSON.parse(localStorage.getItem("chainInfo") as any).chainConf.blockExplorer}address/${item.detail.depositor}`)
                                        }}
                                    />
                                </div>
                            </div> */}
                        </div>}
                    </div>
                </div>
            })
            }
        </div>
    </>
}

export default ActivityTable;