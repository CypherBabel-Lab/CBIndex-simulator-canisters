import React, { useEffect, useState } from "react";
import classes from "./style.module.less";
import Logo from "../Header/Logo/Logo";
import { BellOutlined } from '@ant-design/icons';
import SoundNotice from "../SoundNotice/SoundNotice";
import { ConnectButton, ConnectDialog, useWallet, useConnect, useDialog, useProviders } from "@connect2ic/react"
const headerMenuList = [
  {
    key: "/vaults",
    label: "Copy Fund",
    pathname: "/activefund/[...page]",
  },
];
import { Link } from "react-router-dom";
const PcHeadr = () => {
  const { open, close, isOpen } = useDialog()
  const {
    disconnect,
  } = useConnect({
    onConnect: () => {
      // Signed in
    },
    onDisconnect: () => {
      // Signed out
    }
  })
  const [wallet] = useWallet()
  const [providers] = useProviders()
  // console.log(wallet);
  return (
    <div className={classes.container}>
      <div className={classes.headerTopLayer}>
        <SoundNotice />
        {/* right section of the header's top layer */}
        <div className={classes.headerTopLayerRight}>
          {/* localeLanguage */}
          <div className={classes.localeArea}></div>
          {/* token ? profile: LoginBtn */}
          <div className={classes.localeArea}></div>
        </div>
      </div>
      <div className={classes.drawALine}></div>
      {/* Bottom layer of the PC header */}
      <div className={classes.headerBottomLayer}>
        <Logo />
        <div className={classes.menuArea}>
          {/* Menu */}
          <div className={classes.optionArea}>
            {headerMenuList.map((item, index) => {
              return (
                <Link to={item.key} key={item.key}>
                  <div
                    className={classes.optionItem}
                  >
                    {item.label}
                  </div>
                </Link>
              );
            })}
          </div>
          <div style={{
            display: "flex",
            alignItems: "center"
          }}>
            <Link to={"/notification"}>
              <BellOutlined style={{
                marginRight: "8px",
                cursor: "pointer"
              }} />
            </Link>
            {
              wallet ? <div className="walletBtn" onClick={() => {
                disconnect()
              }}>
                Disconnect
              </div> :
                <div className="walletBtn" onClick={() => {
                  open()
                }}>
                  Connect
                </div>
            }
          </div>

        </div>
      </div>
    </div >
  );
};
export default PcHeadr;
