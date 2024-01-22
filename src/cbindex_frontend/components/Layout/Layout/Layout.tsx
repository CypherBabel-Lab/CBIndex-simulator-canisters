import React, { useEffect, useState } from "react";
import Footer from "../Footer/Footer";
import Header from "../Header/Header/Header";
import classes from "./style.module.less";
import SideBar from "../SideBar/SideBar";

const Layout = ({ children }: any) => {
  return (
    <div className={classes.container}>
      <div className={classes.headerContainer}>
        <Header />
      </div>
      <div className={classes.mainContainer}>
        <div className={classes.sidebarMenu}>
          <SideBar />
        </div>
        <div className={classes.mainPanel}>
          <div className={classes.mainPanelTopContainer}>{children}</div>
          <div className={classes.footerRight}>
            <Footer />
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(Layout);
