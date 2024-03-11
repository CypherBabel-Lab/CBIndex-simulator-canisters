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
  Spin
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
import { createActor } from '../../../declarations/vault/index'
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
const marks = {
  0: "0%",
  25: "25%",
  50: "50%",
  75: "75%",
  100: "100%",
};
const DetailsPage = () => {
  let vault = useRef(null)
  let tokenActor = useRef(null)
  const cloneActiveList = useRef([])
  const [wallet] = useWallet();
  const [balance] = useBalance();
  const navigate = useNavigate();
  const [params] = useSearchParams()
  const [dataSource, setDataSource] = useState({} as any)
  const [swapModalOpen, setSwapModalOpen] = useState(false)
  const [activeList, setActiveList] = useState([])
  const [icrc_ledger] = useCanister("icp_ledger_canister")
  const [ckbtc_ledger] = useCanister("ckbtc_ledger_canister")
  const [cketh_ledger] = useCanister("cketh_ledger_canister")
  const [investModal, setInvestModal] = useState(false)
  const [reddeemModal, setReddeemModal] = useState(false)
  const [userBalance, setUserBalance] = useState({})
  const [selectInvestToken, setSelectInvestToken] = useState("")
  const [investAmount, setInvestAmount] = useState(0)
  const [investModalState, setInvestModalState] = useState({ state: "invest", msg: "" })
  const [shares_token, setShares_token] = useState("")
  const [holders, setHolders] = useState([])
  const [vaultAssets, setVaultAssets] = useState([])
  const [withdrawNum, setWithdrawNum] = useState(0)
  const [selectActiveType, setSelectActiveType] = useState("")

  const filterKey = ["Deposit", "Redemption", "Swap"]

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
      children: <DepositorTable DepositorList={holders} />,
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
  const investStatusDom = {
    "invest": <div style={{
      display: "flex",
      flexDirection: "column"
    }}>
      <Radio.Group
        onChange={(e) => {
          setInvestAmount(0)
          setSelectInvestToken(e.target.value)
        }}
        value={selectInvestToken}
      >
        <Radio value={"ryjl3-tyaaa-aaaaa-aaaba-cai"}>ICP{userBalance["ryjl3-tyaaa-aaaaa-aaaba-cai"]?.amount}</Radio>
        <Radio value={"mxzaz-hqaaa-aaaar-qaada-cai"}>BTC{userBalance["mxzaz-hqaaa-aaaar-qaada-cai"]?.amount}</Radio>
        <Radio value={"ss2fx-dyaaa-aaaar-qacoq-cai"}>ETH{userBalance["mxzaz-hqaaa-aaaar-qaada-cai"]?.amount}</Radio>
      </Radio.Group>
      <InputNumber
        style={{
          width: "50%"
        }}
        min={0}
        placeholder="0"
        parser={parser}
        max={userBalance[selectInvestToken]?.amount ? userBalance[selectInvestToken]?.amount : 0}
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

  const getVaultList = async () => {
    vault.current = createActor(params.getAll("vaultAddress")[0], {
      agent: (wallet as any).ic.agent,
    })
    let config = await vault.current.get_config()
    config.owner = config.owner.toString()
    setShares_token(config.shares_token[0].toString())
    tokenActor.current = tokenCreateActor(config.shares_token[0].toString())
    tokenActor.current.get_holders(BigInt(1), BigInt(100)).then(d => {
      setHolders(d)
    })
    const millisecondsTimestamp = Number(config.deploy_time) / 1e6;
    const date = new Date(millisecondsTimestamp);
    config.deploy_time = getTimeDistanceFromNow(date)
    for (let i = 0; i < config.supported_tokens.length; i++) {
      config.supported_tokens[i] = config.supported_tokens[i].canister_id.toString()
    }
    setDataSource(config)
    await getActiveList()
    await vault.current.get_aum().then(d => {
      setVaultAssets(d.datas["0"])
      let num = 0
      for (let i = 0; i < d.datas["0"].length; i++) {
        num = num + d.datas["0"][i].aum
      }
      config.aum = num
    })
    setDataSource({ ...config })
  }
  const getActiveList = async () => {
    await vault.current.get_tx_records(BigInt(100), []).then(d => {
      let arr = []
      for (let i = 0; i < d.result.length; i++) {
        let tempt = {} as any
        tempt.operation = Object.keys(d.result[i].record)[0]
        tempt.timestamp = Number(d.result[i].timestamp) / 1e6
        tempt.id = i
        if (Object.keys(d.result[i].record)[0] === "Withdraw") {
          let arr = []
          let keys = Object.keys(d.result[i].record[Object.keys(d.result[i].record)[0]].canister_ids)
          for (let i = 0; i < keys.length; i++) {
            arr.push(d.result[i].record[Object.keys(d.result[i].record)[0]].canister_ids[keys[i]].toString())
          }
          tempt.canister = arr
          tempt.shares_num = Number(d.result[i].record[Object.keys(d.result[i].record)[0]].shares_nums)
          let num = 0
          for (let j = 0; j < d.result[i].record.Withdraw.eq_usds.length; j++) {
            num = num + d.result[i].record.Withdraw["eq_usds"][i]
          }
          tempt.amounts = d.result[i].record[Object.keys(d.result[i].record)[0]].amounts
          let canids = []
          for (let h = 0; h < d.result[i].record[Object.keys(d.result[i].record)[0]].canister_ids.length; h++) {
            canids.push(d.result[i].record[Object.keys(d.result[i].record)[0]].canister_ids[h].toString())
          }
          tempt.canister_ids = canids
          tempt.eq_usds = d.result[i].record[Object.keys(d.result[i].record)[0]].eq_usds
          tempt.usds = num
        } else {
          tempt.amount = Number(d.result[i].record[Object.keys(d.result[i].record)[0]].amount)
          tempt.canister = [d.result[i].record[Object.keys(d.result[i].record)[0]].canister_id.toString()]
          tempt.sharesReceived = Number(d.result[i].record[Object.keys(d.result[i].record)[0]].shares_num)
        }
        arr.push(tempt)
      }
      cloneActiveList.current = arr
      setActiveList(arr)
    })
  }

  const approve = async () => {
    let arg: ApproveArgs = {
      fee: [],
      memo: [],
      from_subaccount: [],
      created_at_time: [],
      amount: BigInt(investAmount * 100000000 + 10000),
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
      await vault.current.deposit(Principal.fromText(selectInvestToken), BigInt(investAmount * 100000000)).then(d => {
        console.log(d);
        console.log(!!d["Err"]);
        if (!!d["Err"]) {
          setInvestModalState({ state: "error", msg: "Invest Error!" })
          return
        }
        getVaultList()
        setInvestModalState({ state: "success", msg: "Invest success!" })
      })
    } catch (e) {
      setInvestModalState({ state: "error", msg: "Invest Error!" })
      console.log(e);
    }
  }
  const withdrawFuc = async () => {
    try {
      await vault.current.withdraw(withdrawNum).then(d => {
        console.log(d);
      })
    } catch (e) {
      setInvestModalState({ state: "error", msg: "Invest Error!" })
      console.log(e);
    }
    setReddeemModal(false)
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
    if (!balance) return
    let tempt = {}
    for (let i = 0; i < balance.length; i++) {
      tempt[balance[i].canisterId] = { amount: balance[i].amount }
    }
    setUserBalance(tempt)
  }, [balance, investModalState.state])

  useEffect(() => {
    if (!wallet) return
    getVaultList()
  }, [wallet])

  return (
    <>
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
        onCancel={() => {
          setSwapModalOpen(false)
        }}
      >
        <SwapPage />
      </Modal>
      <Modal maskClosable={false} open={investModal}
        okButtonProps={{
          disabled: investAmount === 0,
          style: {
            display: investModalState.state === "loading" && "none"
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
        onCancel={() => {
          setReddeemModal(false)
        }}
        onOk={() => {
          withdrawFuc()
        }}
        cancelButtonProps={{
          style: {
            display: "none"
          },
        }}
        okButtonProps={{
          disabled: withdrawNum === 0,
        }}
      >
        <div style={{
          fontSize: "20px",
          fontWeight: "600",
          margin: "0 0 var(--margin-md) 0+"
        }}>Redeem from this fund</div>
        <Slider
          marks={marks}
          step={1}
          onChange={(e) => {
            setWithdrawNum(e * 100)
          }}
        />
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
              </div>
              <div className={classes.walletAddrAera}
                onClick={() => {
                  window.open("https://dashboard.internetcomputer.org/canister/" + params.getAll("vaultAddress")[0])
                }}
              >
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
              <span className={classes.walletAddr}
                onClick={() => {
                  window.open("https://dashboard.internetcomputer.org/account/" + AccountIdentifier.fromPrincipal({ principal: Principal.fromText(wallet.principal) }).toHex())
                }}
              >{dataSource.owner} <img src={imge} width={14} height={14} alt="" /></span>
              <span className={classes.ownerSpan}>Fund Creator & Manager</span>
            </div>
          </div>
          <div className={classes.dedtailsHeaderRight}>
            <div
              className="switchNetworksBtn"
              onClick={async () => {
                setInvestModal(true)
              }}
            >
              <VerticalAlignBottomOutlined />
              <span className={classes.headerRightTitle}>Invest</span>
            </div>
            <div
              style={{
                marginRight: "6px",
                marginLeft: "6px",
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
              className="switchNetworksBtn"
              onClick={async () => {
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
              {dataSource.aum ? Number(dataSource.aum).toFixed(2) : 0}
            </div>
            <div className={classes.infoCardTitle}>AUM(USD)</div>
          </div>
          <div className={classes.info_card}>
            <div className={classes.infoCardValue}>{holders.length}</div>
            <div className={classes.infoCardTitle}>Investor</div>
          </div>
          <div className={classes.info_card}>
            <div className={classes.infoCardValue}>
              <Tokenimg tokens={dataSource?.supported_tokens} />
              <div className={classes.assetLogo}>
              </div>
            </div>
            <div className={classes.infoCardTitle}>Supported Tokens</div>
          </div>
          <div className={classes.info_card}>
            <div className={classes.infoCardValue}>
              {dataSource.deploy_time}
            </div>
            <div className={classes.infoCardTitle}>Since Inception</div>
          </div>
        </div>
        <Tabs defaultActiveKey="1" items={items} />
      </div>
    </>
  );
};

export default DetailsPage;
