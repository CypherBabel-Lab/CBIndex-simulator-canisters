import React from "react";
import { Table } from "antd";
import { Spin } from "antd";
import classes from "./style.module.less";
import { Link } from "react-router-dom";
import Tokenimg from '../../../components/Tokenimg/Tokenimg'
import truncateString from '../../../utils/Sting/truncateString'
import shareIcon from '../../../public/icon/share.png'
const VaultsTable = ({ dataSource, loading, total, setPage, address }: any) => {
  const columns = [
    {
      title: "Fund Name",
      dataIndex: "name",
      key: "name",
      render: (text: string, row: any) => {
        return <div className={classes.fundNameColumn}>
          {truncateString(text, 20)}
          {row.owner === address && <div className={`${classes.myFundTag} myCreateLabel`}>My Fund</div>}
        </div>
      },
    },
    {
      title: "Symbol",
      dataIndex: "symbol",
      key: "symbol",
      render: (text: string) => {
        return <>
          <div >
            {truncateString(text, 10)}
          </div>
        </>
      }
    },
    {
      title: "Supported Tokens",
      dataIndex: "supported_tokens",
      key: "supported_tokens",
      render: (tokens: string) => {
        return (
          <div className={classes.denominationAssetColumn}>
            <Tokenimg tokens={tokens} />
          </div>
        );
      },
    },
    {
      title: "Supported Tokens",
      dataIndex: "canisterId",
      key: "canisterId",
      render: (canisterId: string) => {
        return (
          <div className={classes.canisterIdLabel} onClick={() => {
            window.open("https://dashboard.internetcomputer.org/canister/" + canisterId)
          }}>
            {canisterId}  <img src={shareIcon} width={14} height={14} alt="" />
          </div>
        );
      },
    },
    {
      title: "Action",
      dataIndex: "action",
      key: "action",
      render: (_: any, row: any) => {
        return (
          <>
            <Link to={"/details?vaultAddress=" + row.canisterId}>
              Detail
            </Link>
          </>
        );
      },
    },
  ];
  return (
    <>
      <Spin spinning={loading} tip="Loading blockchain data...">
        <Table
          dataSource={dataSource}
          rowKey={(record) => record.name}
          columns={columns as any}
          pagination={{
            pageSize: 10,
          }}
        />
      </Spin>
    </>
  );
};

export default VaultsTable;
