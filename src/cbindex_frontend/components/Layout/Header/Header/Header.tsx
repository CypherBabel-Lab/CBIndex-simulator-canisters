import React, { useEffect, useState } from "react";
// import { useRouter } from "next/router";
import PcHeader from "../PcHeader/PcHeader";
// import MobilHeader from "../MobileHeader/MobileHeader";
// import classes from "./style.module.less";
import { ConnectButton, ConnectDialog, Connect2ICProvider } from "@connect2ic/react"
const Header = () => {
  return (
    <div>
      <div
        className={`${"md:hidden flex"}
          }`}
      >
        <PcHeader />
      </div>
    </div>
  );
};
export default Header;

