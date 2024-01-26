import React from "react";
import { Popover, Table } from "antd";
import { Spin } from "antd";
import classes from "./style.module.less";
import { Link } from "react-router-dom";
import token from '../../../utils/tokenInfo/token.json'
import Tokenimg from '../../../components/Tokenimg/Tokenimg'
function truncateString(inputString: any, maxLength: Number) {
  if (inputString.length > maxLength) {
    return inputString.substring(0, maxLength) + '...';
  }
  return inputString;
}
const VaultsTable = ({ dataSource, loading, total, setPage, address }: any) => {
  const columns = [
    {
      title: "Fund Name",
      dataIndex: "name",
      key: "name",
      render: (text: any, row: any) => {
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
      render: (text: any, row: any) => {
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
      render: (tokens: any, row: any) => {
        return (
          <div className={classes.denominationAssetColumn}>
            <Tokenimg tokens={tokens} />
          </div>
        );
      },
    },
    {
      title: "Action",
      dataIndex: "action",
      key: "action",
      render: (text: any, row: any) => {

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
