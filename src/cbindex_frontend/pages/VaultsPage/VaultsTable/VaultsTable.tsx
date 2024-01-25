import React from "react";
import { Table } from "antd";
// import icon from "../../../utils/TokenIcon/Icon.json";
import { Avatar, Spin } from "antd";
// import Link from "next/link";
// import { ServerAssetes } from "../../../utils/consts/Consts";
import classes from "./style.module.less";
import { Link } from "react-router-dom";
// import { getImageUrl } from '../../../utils/TokenIcon/getIconImage'

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
      title: "Denomination Asset",
      dataIndex: "denominationAssetAddress",
      key: "denominationAssetAddress",
      render: (text: any, row: any) => {
        return (
          <div className={classes.denominationAssetColumn}>
            {/* <Avatar
              src={`${ServerAssetes.Icon + getImageUrl(row.denominationAsset.symbol)}`}
              className={classes.avatar}
            /> */}
            USD
          </div>
        );
      },
    },
    // {
    //   title: "deploy_time",
    //   dataIndex: "deploy_time",
    //   key: "deploy_time",
    //   // sortOrder: 'descend',
    //   // sorter: (a, b) => Number(a.deploy_time) - Number(b.deploy_time),
    //   render: (text: any, row: any) => {
    //     const date = new Date(Number(text));
    //     console.log(date);
    //     return (
    //       <div className={classes.denominationAssetColumn}>
    //         {Number(text)}
    //       </div>
    //     );
    //   },
    // },
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
