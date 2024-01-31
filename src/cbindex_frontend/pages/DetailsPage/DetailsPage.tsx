import React, { useEffect, useState } from "react";
import {
  Tabs,
  Segmented,
  Select,
  Space,
} from "antd";
import {
  ArrowLeftOutlined,
  VerticalAlignBottomOutlined,
  VerticalAlignTopOutlined,
  SwapOutlined,
} from "@ant-design/icons";
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
import { useWallet, useConnect } from "@connect2ic/react";
const DetailsPage = () => {
  const [wallet] = useWallet()
  const navigate = useNavigate();
  const [params] = useSearchParams()
  const [dataSource, setDataSource] = useState({} as any)
  const getVaultList = async () => {
    let vault = createActor(params.getAll("vaultAddress")[0])
    let config = await vault.get_config() as any
    config.owner = config.owner.toString()
    const millisecondsTimestamp = Number(config.deploy_time) / 1e6;
    const date = new Date(millisecondsTimestamp);
    config.deploy_time = getTimeDistanceFromNow(date)
    for (let i = 0; i < config.supported_tokens.length; i++) {
      config.supported_tokens[i] = config.supported_tokens[i].toString()
    }
    setDataSource(config)
  }
  useEffect(() => {
    getVaultList()
  }, [])
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
          <Chart lineData={[]} />
        </div>
      ),
    },
    {
      key: "2",
      label: "Assets",
      children: <AssetTable assetList={[]} />,
    },
    {
      key: "3",
      label: "Investors",
      children: <DepositorTable />,
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
            <div
              className={`plainBtn`}
            >
              Deposit
            </div>
            <div
              className={`plainBtn`}
            >
              Redemption
            </div>
            <div
              className={`plainBtn`}
            >
              Swap
            </div>
          </Space>
        </div>
      ),
    },
  ];
  return (
    <>
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
            >
              <VerticalAlignTopOutlined />
              <span className={classes.headerRightTitle}>Reddeem</span>
            </div>
            <div
              className="switchNetworksBtn"
            >
              <SwapOutlined />
              <span className={classes.headerRightTitle}>Swap</span>
            </div>
            {/* )} */}
          </div>
        </div>
        <div className={classes.card_area}>
          <div className={classes.info_card}>
            <div className={classes.infoCardValue}>
              0
            </div>
            <div className={classes.infoCardTitle}>AUM(USD)</div>
          </div>
          <div className={classes.info_card}>
            <div className={classes.infoCardValue}>{0}</div>
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
