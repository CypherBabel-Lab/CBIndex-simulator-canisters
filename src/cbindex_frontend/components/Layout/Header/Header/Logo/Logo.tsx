import React from "react";
import classes from "./style.module.less";
import logo from '../../../../../public/icon/cbi_logo.png'
const Logo = () => {
  return (
    <>
      <div
        onClick={() => {

        }}
        className={classes.logoArea}
      >
        <img src={logo} width={96} height={34} alt="Logo" />
      </div>
    </>
  );
};
export default Logo
