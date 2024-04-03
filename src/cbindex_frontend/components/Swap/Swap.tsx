import React, { useState, createContext, useContext, useEffect } from "react";
import { Button, InputNumber, Avatar, Modal, Input, List } from "antd";
import { ArrowDownOutlined, DownOutlined, LoadingOutlined, SearchOutlined } from "@ant-design/icons";
import classes from './style.module.less'
import token from '../../utils/tokenInfo/token.json'
import { localePriceNumber } from '../../utils/number/localeNumber'
interface Coin {
    name: string;
    symbol: string;
    canisterId: string;
}
interface UserHold {
    name: string;
    symbol: string;
    amount: number;
}
interface Props {
    supportSellList: Coin[];
    supportBuyList: Coin[];
    userHoldList: UserHold[];
    confirmTransactionEvt?: (sellToken, buyToken, sellAmount) => void;
    calculatePriceFuc?: (sellToken: Coin, buyToken: Coin, changeAmount: number, changeType: string) => Promise<any>;
    vaultSwapAsstes: Object
}
export type ModalType = 'sell' | 'buy' | ''

const ModalTypeContext = createContext(null);

/**
 * @version 0.1
 * @param  supportSellList  支持出售的列表
 * @param  supportBuyList  支持购买的列表
 * @param  userHoldList     用户持有列表
 * @param  confirmTransactionEvt 确认交易事件
 * @param  calculatePriceFuc 计算兑换比列
 * @returns Swap组件
 */
const Swap: React.FC<Props> = ({ supportSellList, supportBuyList, userHoldList, confirmTransactionEvt, calculatePriceFuc, vaultSwapAsstes }) => {
    console.log(vaultSwapAsstes);
    const [modalOpen, setModalOpen] = useState(false)
    const [modalList, setModalList] = useState([])
    const [modalType, setModalType] = useState("" as ModalType)
    const [sellToken, setSellToken] = useState({ name: "BTC", symbol: "BTC", canisterId: "mxzaz-hqaaa-aaaar-qaada-cai" } as Coin)
    const [buyToken, setBuyToken] = useState({ name: "", symbol: "" } as Coin)
    const [sellAmount, setSellAmount] = useState(0)
    const [buyAmount, setBuyAmount] = useState(0)
    const [confirmState, setConfirmState] = useState({ status: true, text: "Choose Token" })
    const [sellBuyAmount, setSellBuyAmount] = useState({ sell: 0, buy: 0 })
    /** @description 交换出售和购买的Token  */
    const exchangeEvt = () => {
        setSellToken({ ...buyToken })
        setSellAmount(sellBuyAmount.buy)
        setBuyToken({ ...sellToken })
    }
    /**
     * @description 设置按钮是否可以点击,按钮显示文本
     * */
    const setConfirmBtnStateFuc = () => {
        if (sellToken.name === "" || buyToken.name === "") {
            setConfirmState({ status: true, text: "Choose Token" })
            return
        }
        if (sellBuyAmount.sell === 0 || sellBuyAmount.buy === 0) {
            setConfirmState({ status: true, text: "Please enter the correct sieze" })
            return
        }
        if (sellBuyAmount.sell > vaultSwapAsstes[sellToken.canisterId].balance) {
            setConfirmState({ status: true, text: "Please enter the correct sieze" })
            return
        }
        setConfirmState({ status: false, text: "Confirm" })
    }

    useEffect(() => {
        setConfirmBtnStateFuc()
        if (sellToken.name === "" || buyToken.name === "") return;
        if (sellAmount === 0 || !sellAmount) return;
        calculatePriceFuc(sellToken, buyToken, sellAmount, 'sell').then(d => {
            setSellBuyAmount({ sell: sellAmount, buy: d })
        })
    }, [sellToken, buyToken, sellAmount])

    useEffect(() => {
        setConfirmBtnStateFuc()
        if (buyToken.name === "" || sellToken.name === "") return;
        if (buyAmount === 0 || !buyAmount) return;
        calculatePriceFuc(sellToken, buyToken, buyAmount, 'buy').then(d => {
            setSellBuyAmount({ buy: buyAmount, sell: d })
        })
    }, [buyAmount])
    useEffect(() => {
        setConfirmBtnStateFuc()
    }, [sellBuyAmount])
    return <ModalTypeContext.Provider value={modalType}>
        <TokenListModal
            modalOpen={modalOpen}
            setModalOpen={setModalOpen}
            modalList={modalList}
            setSellToken={setSellToken}
            setBuyToken={setBuyToken}
            sellToken={sellToken}
            buyToken={buyToken}
            exchangeEvt={exchangeEvt}
            vaultSwapAsstes={vaultSwapAsstes}
        />
        <div style={{
            display: "flex",
            flexDirection: "column",
            width: "100%"
        }}>
            <div style={{
                width: "100%"
            }}>
                <InputNumber
                    style={{
                        marginBottom: "10px",
                        width: "100%"
                    }}
                    placeholder="0.00"
                    controls={false}
                    min={0}
                    value={sellBuyAmount.sell}
                    onChange={(v) => {
                        setSellAmount(v)
                    }}
                    addonAfter={
                        <Button
                            style={{
                                display: "flex"
                            }}
                            onClick={() => {
                                setModalList(supportBuyList)
                                setModalType("sell")
                                setModalOpen(true)
                            }}>
                            {sellToken.name ? <div style={{
                                display: "flex",
                            }}>
                                {sellToken.name}
                                <Avatar style={{
                                    width: "22px",
                                    height: "22px",
                                    marginLeft: "2px"
                                }}
                                    src={token[sellToken.canisterId].icon}
                                />
                            </div> : "Choose Token"}
                        </Button >
                    }
                />
                <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    color: '#76808f',
                    fontSize: "12px"
                }}>
                    <div>
                        <div>
                            ${sellToken.canisterId ? <>{localePriceNumber(vaultSwapAsstes[sellToken.canisterId]?.price)} USD</> : "0"}
                        </div>
                        <div>
                            Balance: ${sellToken.canisterId ? <>{localePriceNumber(vaultSwapAsstes[sellToken.canisterId]?.price * vaultSwapAsstes[sellToken.canisterId]?.balance)} USD</> : "0"}
                        </div>
                    </div>
                    <div style={{

                    }}>
                        Size:{vaultSwapAsstes[sellToken.canisterId]?.balance ? (vaultSwapAsstes[sellToken.canisterId]?.balance).toFixed(6) : 0} <span onClick={() => {
                            setSellAmount(vaultSwapAsstes[sellToken.canisterId].balance)
                        }} style={{
                            cursor: "pointer",
                            color: "#50f6bf"
                        }}>Max</span>
                    </div>
                </div>
            </div>
            <div className={classes.swapPanelDownArrowArea} onClick={() => exchangeEvt()}>
                <ArrowDownOutlined
                    style={{
                        fontSize: "14px",
                        color: "var(--text-third-color)",
                    }}
                />
            </div>
            <div style={{
                width: "100%"
            }}>
                <InputNumber
                    style={{
                        marginBottom: "10px",
                        marginTop: "10px",
                        width: "100%"
                    }}
                    placeholder="0.00"
                    controls={false}
                    min={0}
                    value={sellBuyAmount.buy}
                    onChange={(v) => {
                        setBuyAmount(v)
                    }}
                    addonAfter={<Button
                        style={{
                            display: "flex",

                        }}
                        onClick={() => {
                            setModalList(supportSellList)
                            setModalType("buy")
                            setModalOpen(true)
                        }} >{buyToken.name ?
                            <div style={{
                                display: "flex",
                            }}>
                                {buyToken.name}<Avatar style={{
                                    width: "22px",
                                    height: "22px",
                                    marginLeft: "2px"
                                }}
                                    src={token[buyToken.canisterId].icon}
                                />
                            </div>
                            : "Choose Token"}</Button>}
                />
                <div style={{
                    color: '#76808f',
                    fontSize: "12px",
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "16px"
                }}>
                    <div>
                        {/* {buyToken.canisterId} */}
                        {/* ${vaultSwapAsstes[buyToken.canisterId] ? vaultSwapAsstes[buyToken.canisterId].price : 0} */}
                    </div>
                    <div>
                        {/* Size:{buyToken.canisterId ? vaultSwapAsstes[buyToken.canisterId].balance : 0} */}
                    </div>
                </div>
            </div>
            <Button
                disabled={confirmState.status}
                onClick={() => {
                    confirmTransactionEvt(sellToken, buyToken, sellBuyAmount)
                }}>
                {confirmState.text}
            </Button>
        </div>
    </ModalTypeContext.Provider >
}

/**
 * @description Modal框-选择出售或者购买的Token列表
 * @returns  出售 | 购买的Itmes (sellToken, buyToken)
 */
const TokenListModal = ({ modalOpen, setModalOpen, modalList, setSellToken, setBuyToken, sellToken, buyToken, exchangeEvt, vaultSwapAsstes }) => {
    const modalType = useContext(ModalTypeContext)
    return <>
        <Modal
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
            open={modalOpen} onCancel={() => setModalOpen(false)} onOk={() => setModalOpen(false)} >
            <List
                dataSource={modalList}
                renderItem={(item: any) => (
                    <List.Item
                        key={item.name}
                        className="cursor-pointer"
                        onClick={() => {
                            if (modalType === 'sell') {
                                if (item.name === buyToken.name) {
                                    exchangeEvt()
                                } else {
                                    setSellToken(item)
                                }
                            } else {
                                if (item.name === sellToken.name) {
                                    exchangeEvt()
                                } else {
                                    setBuyToken(item)
                                }
                            }
                            setModalOpen(false)
                        }}
                    >
                        <List.Item.Meta
                            avatar={
                                <Avatar
                                    src={token[item.canisterId].icon}
                                />
                            }
                            title={
                                <div style={{
                                    display: "flex",
                                }}>
                                    <div>
                                        <div style={{
                                            display: "flex"
                                        }}>{(token[item.canisterId].symbol)}:
                                            <div style={{
                                                display: "flex",
                                                color: "var(--text-third-color)",
                                                marginLeft: "var(--margin-xs)"
                                            }}>
                                                <>{vaultSwapAsstes[item.canisterId] ? <>{vaultSwapAsstes[item.canisterId]?.balance.toFixed(6)} (${(vaultSwapAsstes[item.canisterId]?.balance * vaultSwapAsstes[item.canisterId]?.price).toFixed(2)} USD)</> : "0.000000 ($0.00 USD)"}</>
                                            </div>
                                        </div>
                                        <div className={classes.swapLabel}>
                                            {(token[item.canisterId].name)}
                                        </div>
                                    </div>

                                </div>
                            }
                        />
                    </List.Item>
                )}
            />
        </Modal>
    </>
}

export default Swap