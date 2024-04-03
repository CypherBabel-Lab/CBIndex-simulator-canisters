import React from "react";
import { Table, Avatar } from "antd";
import classes from "./style.module.less";
import token from '../../../../utils/tokenInfo/token.json'
import { localePriceNumber } from '../../../../utils/number/localeNumber'
import ShareImg from '../../../../components/ShareImg/ShareImg'



const AssetTable = ({ assetList }: any) => {
  const columns = [
    {
      title: "Token",
      dataIndex: "token_id",
      key: "1",
      render: (text: any, row: any) => {
        return (
          <div className={classes.denominationAssetColumn}>
            <Avatar
              src={token[text.toString()].icon}
              className={classes.avatar}
            />
            {token[text.toString()].symbol}
          </div>
        );
      },
    },
    {
      title: "Canister id",
      dataIndex: "token_id",
      key: "2",
      render: (text) => {
        return <>{text.toString()}<ShareImg onClick={() => {
          window.open("https://dashboard.internetcomputer.org/canister/" + text.toString())
        }} /></>
      }
    },
    {
      title: "Balance",
      dataIndex: "balance",
      key: "3",
      render: (text) => {
        return <>{text.toFixed(6)}</>
      }
    },
    {
      title: "AUM",
      dataIndex: "aum",
      key: "3",
      render: (text) => {
        return <>${localePriceNumber(text)} USD</>
      }
    },
  ];

  return <Table dataSource={assetList} columns={columns} />;
};

export default AssetTable;
