import { Popover } from "antd";
import React from "react";
import classes from "./style.module.less";
import token from '../../utils/tokenInfo/token.json'
const content = (tokens) => {
    return <>
        {tokens.map(it => {
            return (
                <div className={classes.tokenIconPopoverItem} key={it}>
                    <img src={token[it]?.icon} alt="" style={{
                        borderRadius: "9999px",
                    }}
                        className={classes.tokenIconPopoverAvatar}
                    />
                    {token[it]?.name}({token[it]?.symbol})
                </div>
            );
        })}
    </>
}
const Tokenimg = ({ tokens }) => {
    if (!tokens) return <></>
    return <div style={{
        cursor: "pointer"
    }}>
        <Popover content={content(tokens)} trigger="hover" arrow={false}>
            {tokens.map(it => {
                return <img key={it} className={classes.avatar} src={token[it]?.icon} width={24} height={24} alt="" style={{
                    borderRadius: "9999px",
                }} />
            })}
        </Popover>
    </div>
}
export default Tokenimg