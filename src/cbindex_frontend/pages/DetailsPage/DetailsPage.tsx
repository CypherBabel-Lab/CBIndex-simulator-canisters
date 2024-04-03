import React, { useEffect, useRef, useState } from "react";
import {
  Tabs,
  Segmented,
  Select,
  Space,
  Modal,
  Input,
  Radio,
  InputNumber,
  Slider,
  Spin,
  Avatar,
  Skeleton,
  notification
} from "antd";
import {
  ArrowLeftOutlined,
  VerticalAlignBottomOutlined,
  VerticalAlignTopOutlined,
  SwapOutlined,
} from "@ant-design/icons";
import locale from '../../../../.dfx/local/canister_ids.json'
import { getTimeDistanceFromNow } from '../../utils/getTimeDistanceFromNow'
import classes from "./style.module.less";
import { useSearchParams, useNavigate } from "react-router-dom";
import { createActor, idlFactory } from '../../../declarations/vault/index'
import AssetTable from "./TableType/AssetTable/AssetTable";
import DepositorTable from './TableType/DepositorTable/DepositorTable'
import Chart from "../../components/Chart/Chart";
import Tokenimg from "../../components/Tokenimg/Tokenimg";
import imge from '../../public/icon/share.png'
import { Principal } from '@dfinity/principal';
import { AccountIdentifier } from '@dfinity/ledger-icp';
import { useWallet, useConnect, useCanister, useBalance } from "@connect2ic/react";
import SwapPage from "../SwapPage/SwapPage";
import { ApproveArgs } from "@dfinity/ledger-icrc/dist/candid/icrc_ledger";
import ActivityTable from '../../components/ActiveTable/ActivityTable';
import { createActor as tokenCreateActor } from "../../../declarations/token";
import token from '../../utils/tokenInfo/token.json'
import { decimal } from '../../Const/Const'
import { NotificationPlacement } from "antd/es/notification/interface";
import { CheckCircleOutlined } from '@ant-design/icons'
import { localePriceNumber, localeAmountNumber } from "../../utils/number/localeNumber";
const marks = {
  0: "0%",
  25: "25%",
  50: "50%",
  75: "75%",
  100: "100%",
};
const globalDecimals = 100000000
const DetailsPage = () => {
  let vault = useRef(null)
  let tokenActor = useRef(null)
  const cloneActiveList = useRef([])
  const [wallet] = useWallet();
  const navigate = useNavigate();
  const [params] = useSearchParams()
  const [dataSource, setDataSource] = useState({} as any)
  const [swapModalOpen, setSwapModalOpen] = useState(false)
  const [activeList, setActiveList] = useState([])
  const [icrc_ledger] = useCanister("icp_ledger_canister")
  const [ckbtc_ledger] = useCanister("ckbtc_ledger_canister")
  const [cketh_ledger] = useCanister("cketh_ledger_canister")
  const [SwapFactory] = useCanister("SwapFactory")
  const [investModal, setInvestModal] = useState(false)
  const [reddeemModal, setReddeemModal] = useState(false)
  const [reddeemModalState, setReddeemModalState] = useState({ state: "withdraw", msg: "" })
  const [reddeemArray, setReddeemArray] = useState([])
  const [userBalance, setUserBalance] = useState({})
  const [selectInvestToken, setSelectInvestToken] = useState("")
  const [investAmount, setInvestAmount] = useState(0)
  const [investModalState, setInvestModalState] = useState({ state: "invest", msg: "" })
  const [shares_token, setShares_token] = useState("")
  const [holders, setHolders] = useState([])
  const [vaultAssets, setVaultAssets] = useState([])
  const [withdrawNum, setWithdrawNum] = useState(0)
  const [selectActiveType, setSelectActiveType] = useState("")
  const [vaultSwapAsstes, setVaultSwapAsstes] = useState({})
  const [copyState, setCopyState] = useState(false)
  const [vaultNav, setVaultNav] = useState(0)
  const [userHoldShares, setUserHoldShares] = useState({})
  const [timeLoading, setTimeLoading] = useState(false)
  const [supportedTokenLoading, setSupportedTokenLoading] = useState(false)
  const [investorLoading, setInvestorLoading] = useState(false)
  const [aumLoading, setAumLoading] = useState(false)
  const filterKey = ["Deposit", "Redemption", "Swap"]
  const [api, contextHolder] = notification.useNotification();
  const openNotification = (placement: NotificationPlacement, text) => {
    api.info({
      message: `Notification`,
      description: <>{text}</>,
      placement,
      icon: <CheckCircleOutlined style={{ color: "green" }} />
    });
  };

  const items = [
    {
      key: "1",
      label: "Chart",
      children: (
        <div>
          <Space wrap>
            <Segmented
              defaultValue={"aum"}
              options={[
                { label: "Aum", value: "aum" },
                { label: "Nav", value: "nav" },
              ]}
            />
            <Select
              defaultValue="1d"
              style={{ width: 120 }}
              options={[
                { value: "1d", label: "1 Day" },
                { value: "7d", label: "1 Week" },
                { value: "30d", label: "30 Days" },
                { value: "180d", label: "180 Days" },
                { value: "365d", label: "1 Year" },
              ]}
            />
          </Space>
          <Chart />
        </div>
      ),
    },
    {
      key: "2",
      label: "Assets",
      children: <AssetTable assetList={vaultAssets} />,
    },
    {
      key: "3",
      label: "Investors",
      children: <DepositorTable DepositorList={holders} vaultNav={vaultNav} />,
    },
    {
      key: "4",
      label: "Activities",
      children: (
        <div>
          <Space
            wrap
            style={{
              marginBottom: "16px",
            }}
          >
            {filterKey.map(it => {
              return <div
                className={`plainBtn ${it === selectActiveType && "plainBtnActive"}`}
                onClick={() => {
                  setActiveBtnStatusFuc(it)
                }}
              >
                {it}
              </div>
            })}
          </Space>
          <ActivityTable activityList={activeList} vaultInfo={dataSource} />
        </div>
      ),
    },
  ];
  const parser = (value) => {
    return value.replace(/[^\d.]/g, ''); // 去除非数字和小数点
  };
  const initPrice = (amount: any) => {
    console.log(amount);
    return amount
  }
  const investStatusDom = {
    "invest": <div style={{
      display: "flex",
      flexDirection: "column"
    }}>
      <div style={{
        fontWeight: "bold"
      }}>
        Invest
      </div>
      <div style={{
        marginTop: "12px",
        marginBottom: "12px"
      }}>
        Your balance:
      </div>
      <Radio.Group
        onChange={(e) => {
          setInvestAmount(0)
          setSelectInvestToken(e.target.value)
        }}
        value={selectInvestToken}
      >
        <div style={{
          display: "flex"
        }}>
          <Radio value={"ryjl3-tyaaa-aaaaa-aaaba-cai"}>
            <div style={{
              display: "flex"
            }}>
              ICP
              <Avatar
                style={{
                  width: "22px",
                  height: "22px",
                  marginLeft: "2px"
                }}
                src={token["ryjl3-tyaaa-aaaaa-aaaba-cai"].icon} />
              <span style={{
                marginLeft: "4px"
              }}>
                {userBalance["ryjl3-tyaaa-aaaaa-aaaba-cai"]}      {/* {Number(userBalance["ryjl3-tyaaa-aaaaa-aaaba-cai"]).toLocaleString()} {initPrice(userBalance["ryjl3-tyaaa-aaaaa-aaaba-cai"])} */}
              </span>
            </div>
          </Radio>
          <Radio value={"mxzaz-hqaaa-aaaar-qaada-cai"}>
            <div style={{
              display: "flex",
            }}>
              BTC
              <Avatar
                style={{
                  width: "22px",
                  height: "22px",
                  marginLeft: "2px"
                }} src={token["mxzaz-hqaaa-aaaar-qaada-cai"].icon} />
              <span style={{
                marginLeft: "4px"
              }}>
                {userBalance["mxzaz-hqaaa-aaaar-qaada-cai"]}
                {/* {Number(userBalance["mxzaz-hqaaa-aaaar-qaada-cai"]).toLocaleString()} */}
              </span>
            </div>
          </Radio>
          <Radio value={"ss2fx-dyaaa-aaaar-qacoq-cai"}>
            <div style={{
              display: "flex"
            }}>
              ETH
              <Avatar style={{
                width: "22px",
                height: "22px",
                marginLeft: "2px"
              }} src={token["ss2fx-dyaaa-aaaar-qacoq-cai"].icon} />
              <span style={{
                marginLeft: "4px"
              }}>
                {userBalance["ss2fx-dyaaa-aaaar-qacoq-cai"]}
                {/* {Number(userBalance["ss2fx-dyaaa-aaaar-qacoq-cai"]).toLocaleString()} */}
              </span>
            </div>
          </Radio>
        </div>
      </Radio.Group>
      <InputNumber
        style={{
          width: "50%",
          marginTop: "16px"
        }}
        min={0}
        placeholder="0"
        parser={parser}
        max={userBalance[selectInvestToken] ? userBalance[selectInvestToken] : 0}
        onChange={(v) => {
          setInvestAmount(v)
        }}
      />
    </div>,
    "loading": <div style={{
      width: "100%",
      height: "400px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}><Spin></Spin></div>,
    "success": <>{investModalState.msg}</>,
    "error": <>{investModalState.msg}</>
  }
  const reddeemStatusDom = {
    "withdraw": <>
      <div style={{
        // fontSize: "20px",
        fontSize: "14px",
        // fontWeight: "600",
        fontWeight: "bold",
        margin: "0 0 12px 0"
      }}>Redeem from this fund</div>
      <div>
        Your balance: ${userHoldShares[wallet?.principal]?.usd ? localePriceNumber(userHoldShares[wallet?.principal]?.usd) : 0} USD
        {/* Your balance: ${userHoldShares[wallet?.principal]?.usd ? Number(Number(userHoldShares[wallet?.principal]?.usd.toFixed(6))) : 0} 1USD */}
      </div>
      <Slider
        marks={marks}
        step={1}
        onChange={(e) => {
          setWithdrawNum(e * 100)
        }}
      />
      Redeem amount: ${localePriceNumber(userHoldShares[wallet?.principal]?.usd * (withdrawNum / 10000))} USD
    </>,
    "loading": < div style={{
      width: "100%",
      height: "400px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }
    }> <Spin></Spin></div>,
    "success": <>
      Successfully redeemed: {reddeemArray.map(it => {
        return <div style={{
          display: "flex"
        }}>
          {token[it.canisterId].symbol}
          <Avatar
            style={{
              width: "22px",
              height: "22px",
              marginLeft: "2px"
            }} src={token[it.canisterId].icon} /> <span style={{
              marginLeft: "4px",
              marginRight: "4px"
            }}>:</span>
          <span style={{
            marginRight: "2px"
          }}>
            {localeAmountNumber(it.amount)}</span>
          (${localePriceNumber(it.usd)} USD)
        </div>
      })}
    </>,
  }
  const checkVaultCopy = async () => {
    // copy.current = await window.ic.plug.createActor({
    //   canisterId: params.getAll("vaultAddress")[0],
    //   interfaceFactory: idlFactory,
    // });
    // // vault.follow().then(d => {
    // //   console.log(d);
    // // })
    // copy.current.if_followed().then(d => {
    //   setCopyState(d)
    // })
  }
  const getVaultList = async () => {
    vault.current = await (window as any).ic.plug.createActor({
      canisterId: params.getAll("vaultAddress")[0],
      interfaceFactory: idlFactory,
    });
    vault.current.if_followed().then(d => {
      setCopyState(d)
    })
    vault.current.get_nav().then(d => {
      setVaultNav(d)
    })
    let config = await vault.current.get_config()
    config.owner = config.owner.toString()
    setShares_token(config.shares_token[0].toString())
    tokenActor.current = tokenCreateActor(config.shares_token[0].toString())
    tokenActor.current.get_holders(BigInt(1), BigInt(100)).then(d => {
      setHolders(d)
      setInvestorLoading(true)
    })
    const millisecondsTimestamp = Number(config.deploy_time) / 1e6;
    const date = new Date(millisecondsTimestamp);
    config.deploy_time = getTimeDistanceFromNow(date)
    setTimeLoading(true)
    for (let i = 0; i < config.supported_tokens.length; i++) {
      config.supported_tokens[i] = config.supported_tokens[i].canister_id.toString()
    }
    setSupportedTokenLoading(true)
    setDataSource(config)
    await getActiveList()
    await vault.current.get_aum().then(d => {
      setAumLoading(true)
      if (d.datas.length) {
        setVaultAssets(d.datas["0"])
        let num = 0
        let tempt = {}
        for (let i = 0; i < d.datas["0"].length; i++) {
          tempt[d.datas["0"][i].token_id.toString()] = {
            balance: d.datas["0"][i].balance,
            price: d.datas["0"][i].price
          }
          num = num + d.datas["0"][i].aum
        }
        setVaultSwapAsstes(tempt)
        config.aum = num
      } else {
        config.aum = 0
      }
    })
    setDataSource({ ...config })
  }
  const getActiveList = async () => {
    await vault.current.get_tx_records(BigInt(100), []).then(d => {
      let arr = []
      for (let i = 0; i < d.result.length; i++) {
        let tempt = {} as any
        tempt.timestamp = Number(d.result[i].timestamp) / 1e6
        tempt.id = i
        switch (Object.keys(d.result[i].record)[0]) {
          case "Swap":
            tempt.operation = "Swap"
            tempt.operator = d.result[i].record.Swap.operator.toString()
            tempt.outgoingAssetAmount = d.result[i].record.Swap.token0_amount;
            tempt.outgoingCanisterId = d.result[i].record.Swap.token0.toString();
            tempt.incomingAssetAmount = d.result[i].record.Swap.token1_amount
            tempt.incomingCanisterId = d.result[i].record.Swap.token1.toString();
            break;
          case "Withdraw":
            tempt.operation = "Withdraw"
            tempt.operator = d.result[i].record.Withdraw.operator.toString()
            let arr = []
            let keys = Object.keys(d.result[i].record[Object.keys(d.result[i].record)[0]].canister_ids)
            for (let j = 0; j < keys.length; j++) {
              arr.push(d.result[i].record[Object.keys(d.result[i].record)[0]].canister_ids[keys[j]].toString())
            }
            tempt.canister = arr
            tempt.shares_num = Number(d.result[i].record[Object.keys(d.result[i].record)[0]].shares_nums)
            let num = 0
            for (let j = 0; j < d.result[i].record.Withdraw.eq_usds.length; j++) {
              num = num + d.result[i].record.Withdraw["eq_usds"][j]
            }
            tempt.amounts = d.result[i].record[Object.keys(d.result[i].record)[0]].amounts
            let canids = []
            for (let h = 0; h < d.result[i].record[Object.keys(d.result[i].record)[0]].canister_ids.length; h++) {
              canids.push(d.result[i].record[Object.keys(d.result[i].record)[0]].canister_ids[h].toString())
            }
            tempt.canister_ids = canids
            tempt.eq_usds = d.result[i].record[Object.keys(d.result[i].record)[0]].eq_usds
            tempt.usds = num.toFixed(2)
            break;
          case "Deposit":
            tempt.operation = "Deposit"
            tempt.operator = d.result[i].record.Deposit.operator.toString()
            tempt.amount = Number(d.result[i].record[Object.keys(d.result[i].record)[0]].amount)
            tempt.canister = [d.result[i].record[Object.keys(d.result[i].record)[0]].canister_id.toString()]
            tempt.sharesReceived = Number(d.result[i].record[Object.keys(d.result[i].record)[0]].shares_num)
            break;
        }
        arr.push(tempt)
      }
      cloneActiveList.current = arr

      setActiveList(arr)
    })
  }
  const getUserBalance = async () => {
    let btc = ""
    let eth = ""
    let icp = ""
    await ckbtc_ledger.icrc1_balance_of({ owner: Principal.fromText(wallet.principal), subaccount: [] }).then(d => {
      btc = (Number(d) / globalDecimals).toFixed(6)
    })
    await cketh_ledger.icrc1_balance_of({ owner: Principal.fromText(wallet.principal), subaccount: [] }).then(d => {
      eth = (Number(d) / globalDecimals).toFixed(6)
    })
    await icrc_ledger.icrc1_balance_of({ owner: Principal.fromText(wallet.principal), subaccount: [] }).then(d => {
      icp = (Number(d) / globalDecimals).toFixed(6)
    })
    let tempt = { "mxzaz-hqaaa-aaaar-qaada-cai": btc, "ss2fx-dyaaa-aaaar-qacoq-cai": eth, "ryjl3-tyaaa-aaaaa-aaaba-cai": icp }
    setUserBalance(tempt)
  }
  useEffect(() => {
    console.log(timeLoading);
  }, [timeLoading])
  const approve = async () => {
    let arg: ApproveArgs = {
      fee: [],
      memo: [],
      from_subaccount: [],
      created_at_time: [],
      amount: BigInt(investAmount * globalDecimals + 10000),
      expected_allowance: [],
      expires_at: [],
      spender: {
        owner: Principal.fromText(params.getAll("vaultAddress")[0]),
        subaccount: [],
      }
    }
    try {
      if (selectInvestToken === "ryjl3-tyaaa-aaaaa-aaaba-cai") {
        await icrc_ledger.icrc2_approve(arg);
      }
      if (selectInvestToken === "mxzaz-hqaaa-aaaar-qaada-cai") {
        await ckbtc_ledger.icrc2_approve(arg);
      }
      if (selectInvestToken === "ss2fx-dyaaa-aaaar-qacoq-cai") {
        await cketh_ledger.icrc2_approve(arg);
      }
    } catch (e) {
      setInvestModalState({ msg: "Wallet declined the action!", state: "error" })
      throw Error("Approve Error!", e)
    }
  }

  const invest = async () => {
    setInvestModalState({ state: "loading", msg: "Loading..." })
    await approve()
    try {
      await vault.current.deposit(Principal.fromText(selectInvestToken), BigInt(investAmount * globalDecimals)).then(d => {
        console.log(d);
        if (!!d["Err"]) {
          console.log(d["Err"]);
          setInvestModalState({ state: "error", msg: "Invest Error!" })
          return
        }
        setAumLoading(false)
        setInvestorLoading(false)
        getVaultList()
        getUserBalance()
        setInvestModalState({ state: "success", msg: "Invest successful!" })
      })
    } catch (e) {
      setInvestModalState({ state: "error", msg: "Invest Error!" })
      console.log(e);
    }
  }
  const withdrawFuc = async () => {
    setReddeemModalState({ state: "loading", msg: "Loading" })
    try {
      await vault.current.withdraw(withdrawNum).then(d => {
        console.log(d);

        let array = []
        for (let i = 0; i < d.Ok.canister_ids.length; i++) {
          let tempt = { canisterId: "", amount: 0, usd: "" }
          tempt.canisterId = d.Ok.canister_ids[i].toString()
          tempt.amount = d.Ok.amounts[i]
          tempt.usd = d.Ok.eq_usds[i]
          array.push(tempt)
        }
        setReddeemArray(array)
        getVaultList()
        getUserBalance()
        setReddeemModalState({ state: "success", msg: "Withdraw successful!" })
      })
    } catch (e) {
      setReddeemModalState({ state: "error", msg: "Withdraw error!" })
      console.log(e);
    }
  }

  const setInvestModalStateFuc = () => {
    setInvestModal(false)
    setInvestAmount(0)
    setSelectInvestToken("")
    setInvestModalState({ state: "invest", msg: "" })
  }

  const setActiveBtnStatusFuc = (type) => {
    if (type === selectActiveType) {
      setSelectActiveType("")
      setActiveList([...cloneActiveList.current])
      return
    }
    let f = cloneActiveList.current.filter((it) => it.operation === type)
    setActiveList([...f])
    setSelectActiveType(type)
  }

  useEffect(() => {
    checkVaultCopy()
    if (!wallet) return
    getVaultList()
    getUserBalance()
  }, [wallet])

  useEffect(() => {
    let tempt = {}
    for (let i = 0; i < holders.length; i++) {
      tempt[holders[i]["0"].owner.toString()] = { shares: Number(holders[i]["1"]) / decimal, usd: ((Number(holders[i]["1"]) / decimal) * vaultNav) }
    }
    setUserHoldShares(tempt)
  }, [holders, vaultNav])
  return (
    <>
      {contextHolder}
      <SwapPage vaultActor={vault.current} getVaultList={getVaultList} vaultSwapAsstes={vaultSwapAsstes} setSwapModalOpen={setSwapModalOpen} swapModalOpen={swapModalOpen} />
      <Modal maskClosable={false} open={investModal}
        okButtonProps={{
          disabled: investAmount === 0,
          style: {
            display: (investModalState.state === "loading" || investModalState.state === "success") && "none"
          }
        }}
        cancelButtonProps={{
          style: {
            display: "none"
          }
        }}
        closeIcon={!(investModalState.state === "loading")}
        onCancel={() => {
          setInvestModalStateFuc()
        }}
        onOk={() => {
          if (investModalState.state === "success" || investModalState.state === "error") {
            setInvestModalStateFuc()
            return
          }
          invest()
        }}
      >
        {investStatusDom[investModalState.state]}
      </Modal>
      <Modal maskClosable={false} open={reddeemModal}
        closeIcon={!(reddeemModalState.state === "loading")}
        okButtonProps={{
          disabled: withdrawNum === 0,
          style: {
            display: (reddeemModalState.state === "loading" || reddeemModalState.state === "success") && "none"
          }
        }}
        onCancel={() => {
          setReddeemModal(false)
          setReddeemModalState({ state: "withdraw", msg: "" })
        }}
        onOk={() => {
          if (reddeemModalState.state === "success") {
            setReddeemModal(false)
            setReddeemModalState({ state: "withdraw", msg: "" })
            return
          }
          withdrawFuc()
        }}
        cancelButtonProps={{
          style: {
            display: "none"
          },
        }}
      >
        {reddeemStatusDom[reddeemModalState.state]}
      </Modal>
      <div className={classes.detailsPageContainer}>
        <div className={classes.backArea}>
          <ArrowLeftOutlined
            style={{
              fontSize: "20px",
              color: "var(--text-third-color)",
              cursor: "pointer",
              marginRight: "16px",
            }}
            onClick={() => navigate(-1)}
          />
          <span
            style={{
              fontWeight: "bold",
              fontSize: "18px",
              color: "var(--text-third-color)",
            }}
          >
            Fund Detail
          </span>
        </div>
        <div className={classes.detailsHeadedr}>
          <div className={classes.dedtailsHeaderLeft}>
            <div style={{
              display: "flex"
            }}
            >
              <div className={classes.fundName}>
                {dataSource.name}

                {timeLoading ? dataSource.name : <Skeleton.Input size="small" active={true} />}
              </div>
              <div className={classes.walletAddrAera}
                onClick={() => {
                  window.open("https://dashboard.internetcomputer.org/canister/" + params.getAll("vaultAddress")[0])
                }}>
                <span className={classes.walletAddr}
                  style={{
                    marginLeft: "4px"
                  }
                  }>
                  {params.getAll("vaultAddress")[0]}
                  <img style={{
                    marginLeft: "4px"
                  }} src={imge} width={14} height={14} alt="" />
                </span>
              </div>
            </div>
            <div className={classes.walletAddrAera}>
              <div className={classes.walletAddr}
                onClick={() => {
                  window.open("https://dashboard.internetcomputer.org/account/" + AccountIdentifier.fromPrincipal({ principal: Principal.fromText(wallet.principal) }).toHex())
                }}
              >
                {timeLoading ? <>{dataSource.owner} </> : <>
                  <Skeleton.Input active={true} size={"small"} style={{
                    width: "500px",
                    marginRight: "4px"
                  }} />
                </>}
                <img src={imge} width={14} height={14} alt="" /></div>
              <span className={classes.ownerSpan}>Fund Creator & Manager</span>
            </div>
          </div>
          <div className={classes.dedtailsHeaderRight}>
            <div
              style={{
                marginRight: "6px",
              }}
              className="switchNetworksBtn"
              onClick={async () => {

                if (copyState) {
                  vault.current.unfollow().then(d => {
                    setCopyState(!copyState)
                    openNotification('topRight', "Successfully uncopied this fund! You will not receive any notifications of the fund's activities anymore.")
                  })
                } else {
                  vault.current.follow().then(d => {
                    setCopyState(!copyState)
                    openNotification('topRight', "Successfully copied this fund! You will receive notifications of the fund's activities.")
                  })
                }
              }}
            >
              <span>{copyState ? "Cancel Copy" : "Copy"}</span>
            </div>
            <div
              className="switchNetworksBtn"
              onClick={async () => {
                setInvestModal(true)
              }}
              style={{
                marginRight: "6px",
              }}
            >
              <VerticalAlignBottomOutlined />
              <span className={classes.headerRightTitle}>Invest</span>
            </div>
            <div
              style={{
                marginRight: "6px",
              }}
              className="switchNetworksBtn"
              onClick={async () => {
                setReddeemModal(true)
              }}
            >
              <VerticalAlignTopOutlined />
              <span className={classes.headerRightTitle}>Reddeem</span>
            </div>
            <div
              className={dataSource.owner === wallet?.principal ? "switchNetworksBtn" : "disabled"}
              onClick={async () => {
                // if (vaultAssets.length === 0) return
                // if (dataSource.owner !== wallet?.principal) return
                setSwapModalOpen(true)
              }}
            >
              <SwapOutlined />
              <span className={classes.headerRightTitle}>Swap</span>
            </div>
          </div>
        </div>
        <div className={classes.card_area}>
          <div className={classes.info_card}>
            <div className={classes.infoCardValue}>
              {aumLoading ? <>{dataSource.aum ? <>${localePriceNumber(dataSource.aum)}</> : 0}</> : <Skeleton.Input size="large" active={true} />}
            </div>
            <div className={classes.infoCardTitle}>AUM (USD)</div>
          </div>
          <div className={classes.info_card}>
            <div className={classes.infoCardValue}>
              {investorLoading ? holders.length : <Skeleton.Input size="large" active={true} />}
            </div>
            <div className={classes.infoCardTitle}>Investor</div>
          </div>
          <div className={classes.info_card}>
            <div className={classes.infoCardValue}>
              {supportedTokenLoading ? <Tokenimg tokens={dataSource?.supported_tokens} /> : <Skeleton.Input size="large" active={true} />}
            </div>
            <div className={classes.infoCardTitle}>Supported Tokens</div>
          </div>
          <div className={classes.info_card}>
            <div className={classes.infoCardValue}>
              {timeLoading ? dataSource.deploy_time : <Skeleton.Input size="large" active={true} />}
            </div>
            <div className={classes.infoCardTitle}>Since Inception</div>
          </div>
          {/* <div className={classes.info_card}>
            <Skeleton.Input size="large"  />
          </div> */}
        </div>
        <Tabs defaultActiveKey="1" items={items} />
      </div>
    </>
  );
};

export default DetailsPage;
