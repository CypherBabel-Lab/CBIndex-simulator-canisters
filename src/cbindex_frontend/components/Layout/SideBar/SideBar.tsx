
import React, { useState } from "react";
import classes from "./style.module.less";
import { Link, useLocation } from "react-router-dom"

const SideBar = ({ }) => {
  const location = useLocation()
  const [list, setList] = useState([{
    name: "Invest in Fund",
    url: "/vaults",
    pathname: "/activefund/[...page]",
  },
  {
    name: "Create Fund",
    url: "/createactivefund",
    pathname: "/activefund/[...page]",
  },
  ]);
  const checkColor = (url: string) => {
    if (location.pathname === '/details' && url === '/vaults') {
      return "#fff"
    }
    if (location.pathname === url) {
      return "#fff"
    }
  }
  return (
    <>
      {
        true && (
          <div className={classes.container}>
            <div className={classes.functionArea}>
              <div>
                {list.map((item: any) => (
                  <Link to={item.url} key={item.url}>
                    <div
                      key={item.name}
                      style={{
                        color: checkColor(item.url),
                        marginTop: "16px",
                      }}
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
