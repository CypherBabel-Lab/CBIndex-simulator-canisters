
import React, { useState, useEffect } from "react";
import classes from "./style.module.less";
import { Badge, Statistic, Modal, Spin } from "antd";
import {
  ExclamationCircleOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
const { Countdown } = Statistic;
import { Routes, Route, Link } from "react-router-dom"
const SideBar = ({ }) => {
  const [message, setMessage] = useState({
    message: "",
    description: "",
    placement: "",
    icon: <></>
  })
  const [loading, setLoading] = useState(false)
  const [menuStatus, setMenuStatus] = useState(true);
  const [list, setList] = useState([{
    name: "Invest in Fund",
    url: "/vaults",
    pathname: "/activefund/[...page]",
  },
  {
    name: "Create Fund",
    url: "/createactivefund",
    pathname: "/activefund/[...page]",
  },] as any);
  const errorInfo = {
    message: "Notification",
    description: "Failed to claim faucet. Please try again later.",
    placement: "topRight",
    icon: (
      <>
        <ExclamationCircleOutlined style={{ color: "red", marginRight: "10px" }} />
      </>
    ),
  };
  const fuacetSuccess = {
    message: "Notification",
    description: "Successfully claimed 10,000 DAI. Now, you can make investments.",
    placement: "topRight",
    icon: (
      <>
        <CheckCircleOutlined style={{ color: "green", marginRight: "10px" }} />
      </>
    ),
  };
  //url
  const linkUrlObj = {
    activefund: [
      {
        name: "Invest in Fund",
        url: "/activefund/vaults",
        pathname: "/activefund/[...page]",
      },
      {
        name: "Create Fund",
        url: "/activefund/createactivefund",
        pathname: "/activefund/[...page]",
      },
    ],
  };
  return (
    <>
      {/* <Modal open={loading} closeIcon={false} onOk={() => {
        setLoading(false)
      }}
        okButtonProps={{
          style: {
            display: modalContentLoading ? "none" : ""
          }
        }}
        cancelButtonProps={{
          style: {
            display: "none"
          }
        }}
        centered
      >
        {modalContentLoading && <div className={classes.claimLoaidng}>
          <div>
            <Spin />
          </div>
          <div
            style={{
              marginTop: "var(--margin-sm)",
            }}
          >
            Claiming DAI...
          </div>
        </div>}
        {!modalContentLoading && <>
          <div className={classes.faucetSuccess}>
            {message.icon}
            {message.description}
          </div>
        </>
        }
      </Modal > */}
      {/* <Notification onRef={MyNotificationRef} /> */}
      {
        menuStatus && (
          <div className={classes.container}>
            <div className={classes.functionArea}>
              <div>
                {list.map((item: any) => (
                  <Link to={item.url} key={item.url}>
                    <div
                      // style={{
                      //   color:
                      //     selectUrlFuc() === item.url
                      //       ? "#fff"
                      //       : "rgb(118,128,143)",
                      //   marginTop: "16px",
                      // }}
                      key={item.name}
                    >
                      {item.name}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )
      }
    </>
  );
};

export default SideBar;
