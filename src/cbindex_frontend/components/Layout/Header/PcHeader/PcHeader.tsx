import React, { useEffect, useState } from "react";
// import { useRouter } from "next/router";
import classes from "./style.module.less";
// import Link from "next/link";
import Logo from "../Header/Logo/Logo";
import SoundNotice from "../SoundNotice/SoundNotice";
// import { useWeb3Modal } from "@web3modal/wagmi/react";
// import { useNetwork } from "wagmi";
// import { defineChain } from "viem";
// import { ethers } from "ethers";
import { ConnectButton, ConnectDialog, Connect2ICProvider } from "@connect2ic/react"
const headerMenuList = [
  {
    key: "/activefund/vaults",
    label: "Active Fund",
    pathname: "/activefund/[...page]",
  },
];
const PcHeadr = () => {
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
                <a href={item.key} key={item.key}>
                  <div
                    className={classes.optionItem}
                  >
                    {item.label}
                  </div>
                </a>
              );
            })}
          </div>
          <div>
            <ConnectButton />
          </div>
       
        </div>
      </div>
    </div >
  );
};
export default PcHeadr;
