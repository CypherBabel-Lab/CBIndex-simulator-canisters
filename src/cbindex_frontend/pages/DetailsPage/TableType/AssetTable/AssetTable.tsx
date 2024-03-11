import React from "react";
import { Table, Avatar } from "antd";
// import icon from "../../../utils/TokenIcon/Icon.json";
// import { ServerAssetes } from "../../../utils/consts/Consts";
import classes from "./style.module.less";
import token from '../../../../utils/tokenInfo/token.json'
// import { getImageUrl } from '../../../utils/TokenIcon/getIconImage'
const AssetTable = ({ assetList }: any) => {
  console.log(assetList);

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
        return <>{text.toString()}</>
      }
    },
    {
      title: "Balance",
      dataIndex: "aum",
      key: "3",
      render: (text) => {
        return <>{text}</>
      }
    },
  ];

  return <Table dataSource={assetList} columns={columns} />;
};

export default AssetTable;
