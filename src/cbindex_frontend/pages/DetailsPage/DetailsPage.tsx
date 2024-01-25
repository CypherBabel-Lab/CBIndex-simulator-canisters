import React, { useEffect, useState } from "react";
import {
  Button,
  InputNumber,
  Tabs,
  Avatar,
  Modal,
  Spin,
  Segmented,
  Select,
  Space,
  Slider,
  Checkbox,
} from "antd";
import {
  ArrowLeftOutlined,
  VerticalAlignBottomOutlined,
  VerticalAlignTopOutlined,
  SwapOutlined,
} from "@ant-design/icons";
import { DownCircleOutlined } from "@ant-design/icons";
import classes from "./style.module.less";
import { useSearchParams, useNavigate } from "react-router-dom";
import { createActor } from '../../../declarations/vault/index'
import AssetTable from "./TableType/AssetTable/AssetTable";
import DepositorTable from './TableType/DepositorTable/DepositorTable'
import Chart from "../../components/Chart/Chart";
const DetailsPage = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams()
  const [dataSource, setDataSource] = useState({} as any)
  const getVaultList = async () => {
    console.log(params.getAll("vaultAddress")[0]);

    let vault = createActor(params.getAll("vaultAddress")[0])
    let config = await vault.get_config() as any
    config.owner = config.owner.toString()
    setDataSource(config)
    console.log(config.owner.toString());

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
            <div className={classes.fundName}>
              {dataSource.name}
            </div>
            <div className={classes.walletAddrAera}>
              <span className={classes.walletAddr}>{dataSource.owner}</span>
              <span className={classes.ownerSpan}>Fund Creator & Manager</span>
            </div>
          </div>
          <div className={classes.dedtailsHeaderRight}>
            <div
              // onClick={async () => clickInvestBtnEvt()}
              className="switchNetworksBtn"
            >
              <VerticalAlignBottomOutlined />
              <span className={classes.headerRightTitle}>Invest</span>
            </div>
            <div
              // onClick={async () => clickRedeemBtnEvt()}
              style={{
                marginRight: "6px",
                marginLeft: "6px",
              }}
              className="switchNetworksBtn"
            >
              <VerticalAlignTopOutlined />
              <span className={classes.headerRightTitle}>Reddeem</span>
            </div>
            {/* {address[0] === vaultInfo.owner && ( */}
            <div
              // onClick={() => clickSwapBtnEvt()}
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
            {/* <div className={classes.infoCardValue}>{DepositorList.length}</div> */}
            <div className={classes.infoCardTitle}>Investor</div>
          </div>
          <div className={classes.info_card}>
            <div className={classes.infoCardValue}>
              {/* {vaultInfo.denominationAsset?.symbol} */}
              USDT
              <div className={classes.assetLogo}>
                {/* <Image
                  src={`${ServerAssetes.Icon + getImageUrl(vaultInfo.denominationAsset?.symbol)}`}
                  width={20}
                  height={20}
                  alt="icon"
                /> */}
              </div>
            </div>
            <div className={classes.infoCardTitle}>Denomination Asset</div>
          </div>
          <div className={classes.info_card}>
            <div className={classes.infoCardValue}>
              1 Months Ago
              {/* {getTimeDistanceFromNow(vaultInfo?.createdAt)} */}
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
