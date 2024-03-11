import React, { useState, createContext, useContext, useEffect } from "react";
import { Button, InputNumber, Avatar, Modal, Input, List } from "antd";
import { ArrowDownOutlined, DownOutlined, LoadingOutlined, SearchOutlined } from "@ant-design/icons";
import classes from './style.module.less'
interface Coin {
    name: string;
    symbol: string;
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
    calculatePriceFuc?: (sellToken: string, buyToken: string, changeAmount: number, changeType: string) => number;
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
const Swap: React.FC<Props> = ({ supportSellList, supportBuyList, userHoldList, confirmTransactionEvt, calculatePriceFuc }) => {
    const [modalOpen, setModalOpen] = useState(false)
    const [modalList, setModalList] = useState([])
    const [modalType, setModalType] = useState("" as ModalType)
    const [sellToken, setSellToken] = useState({ name: "a1", symbol: "A" } as Coin)
    const [buyToken, setBuyToken] = useState({ name: "", symbol: "" } as Coin)
    const [sellAmount, setSellAmount] = useState(0)
    const [buyAmount, setBuyAmount] = useState(0)
    const [confirmState, setConfirmState] = useState({ status: true, text: "Choose Token" })
    /** @description 交换出售和购买的Token  */
    const exchangeEvt = () => {
        setSellToken(buyToken)
        setSellAmount(buyAmount)
        setBuyToken(sellToken)
        setBuyAmount(sellAmount)
    }

    /**
     * @description 设置按钮是否可以点击,按钮显示文本
     * */
    const setConfirmBtnStateFuc = () => {
        if (sellToken.name === "" || buyToken.name === "") {
            setConfirmState({ status: true, text: "Choose Token" })
            return
        }
        if (sellAmount === 0 || buyAmount === 0 || !buyAmount || !sellAmount) {
            setConfirmState({ status: true, text: "Please enter the correct sieze" })
            return
        }
        setConfirmState({ status: false, text: "Confirm" })
    }

    useEffect(() => {
        setConfirmBtnStateFuc()
        if (sellToken.name === "" || buyToken.name === "") return;
        if (sellAmount === 0 || !sellAmount) return;
        setBuyAmount(calculatePriceFuc(sellToken.name, buyToken.name, sellAmount, 'sell'))
    }, [sellToken, buyToken, sellAmount])

    useEffect(() => {
        setConfirmBtnStateFuc()
        if (buyToken.name === "" || sellToken.name === "") return;
        if (buyAmount === 0 || !buyAmount) return;
        setSellAmount(calculatePriceFuc(sellToken.name, buyToken.name, buyAmount, 'buy'))
    }, [buyAmount])

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
        />
        <div style={{
            display: "flex",
            flexDirection: "column",
            width: "100%"
        }}>
            <InputNumber
                placeholder="0.00"
                controls={false}
                min={0}
                value={sellAmount}
                onChange={(v) => {
                    setSellAmount(v)
                }}
                addonAfter={<Button onClick={() => {
                    setModalList(supportBuyList)
                    setModalType("sell")
                    setModalOpen(true)
                }}> {sellToken.name} Choose Token</Button >}
            />
            <div className={classes.swapPanelDownArrowArea} onClick={() => exchangeEvt()}>
                <ArrowDownOutlined
                    style={{
                        fontSize: "14px",
                        color: "var(--text-third-color)",
                    }}
                />
            </div>
            <InputNumber
                placeholder="0.00"
                controls={false}
                min={0}
                value={buyAmount}
                onChange={(v) => {
                    setBuyAmount(v)
                }}
                addonAfter={<Button onClick={() => {
                    setModalList(supportSellList)
                    setModalType("buy")
                    setModalOpen(true)
                }} >{buyToken.name}Choose Token</Button>}
            />
            <Button
                disabled={confirmState.status}
                onClick={() => {
                    confirmTransactionEvt(sellToken, buyToken, sellAmount)
                }}>
                {confirmState.text}
            </Button>
        </div>
    </ModalTypeContext.Provider>
}

/**
 * @description Modal框-选择出售或者购买的Token列表
 * @returns  出售 | 购买的Itmes (sellToken, buyToken)
 */
const TokenListModal = ({ modalOpen, setModalOpen, modalList, setSellToken, setBuyToken, sellToken, buyToken, exchangeEvt }) => {
    const [searchTokenName, setSearchTokenName] = useState("");
    const modalType = useContext(ModalTypeContext)
    return <>
        <Modal open={modalOpen} onCancel={() => setModalOpen(false)} onOk={() => setModalOpen(false)} >
            <Input
                style={{
                    width: "90%",
                    marginBottom: "18px",
                    backgroundColor: "transparent",
                    borderRadius: "20px",
                }}
                prefix={<SearchOutlined />}
                placeholder={"Search by token or paste address"}
                onChange={(e) => {
                    setSearchTokenName(e.target.value);
                }}
                value={searchTokenName}
            />
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
                                // src={getImageUrlFuc(item.coinId)}
                                />
                            }
                            title={
                                <div style={{
                                    display: "flex",
                                }}>
                                    <div>
                                        <div>{(item.name)}:</div>
                                        <div className={classes.swapLabel}>
                                            {(item.symbol)}
                                        </div>
                                    </div>
                                    <div style={{
                                        display: "flex",
                                        color: "var(--text-third-color)",
                                        marginLeft: "var(--margin-xs)"
                                    }}>
                                        {/* {Number(item.balance).toFixed(2)} {item.balanceOfUsd} */}
                                        6.16 ($320,951.45 USD)
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