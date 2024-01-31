import React, { useState } from "react";
import { Input, Button, Modal, Spin } from "antd";
import classes from "./style.module.less";
import { useWallet } from "@connect2ic/react"
import { Metadata } from '../../../declarations/vault_factory/vault_factory.did'
import { Principal } from '@dfinity/principal';
const rule = /^[a-zA-Z0-9]{3,50}$/;
import { useCanister } from "@connect2ic/react";
import MySelect from '../../components/Select/Select'
import locale from '../../../../.dfx/local/canister_ids.json'
import { ApproveArgs } from "src/declarations/icp_ledger_canister/icp_ledger_canister.did";
import token from '../../utils/tokenInfo/token.json'
const CreateVaultPage = () => {
  const [vault_factory] = useCanister("vault_factory")
  const [icrc_ledger] = useCanister("icp_ledger_canister")
  const [show, setShow] = useState(true)
  const [createObj, setCreateObj] = useState({
    name: "",
    symbol: "",
  });
  const [wallet] = useWallet() as any
  const [createModal, setCreateModal] = useState(false);
  const [createStatus, setCreateStatus] = useState({
    status: "create",
    msg: "",
  })
  const [nameStatus, setNameStatus] = useState(true);
  const [symbolStatus, setSymbolStatus] = useState(true);
  const [tokensPrincipal, setTokensPrincipal] = useState([])
  const [tokens, setTokens] = useState([])
  const approve = async () => {
    let arg: ApproveArgs = {
      fee: [],
      memo: [],
      from_subaccount: [],
      created_at_time: [],
      amount: BigInt(500000000),
      expected_allowance: [],
      expires_at: [],
      spender: {
        owner: Principal.fromText(locale.vault_factory.local),
        subaccount: [],
      }
    }
    try {
      await icrc_ledger.icrc2_approve(arg)
      await vault_factory.transfer_icp()
    } catch (e) {
      setCreateStatus({ msg: "Approve Error!", status: "error" })
      throw Error("CBIndex:Approve Error!")
    }
  }
  const createVault = async () => {
    setCreateStatus({ ...createStatus, status: "loading" })
    if (!wallet) return
    await approve()
    const initArgs: Metadata = {
      fee: BigInt("10000"),
      decimals: 8,
      fee_to: Principal.fromText(wallet.principal),
      owner: Principal.fromText(wallet.principal),
      name: createObj.name,
      symbol: createObj.symbol,
      is_test_token: [false],
    };
    vault_factory.create_vault(initArgs, [...tokensPrincipal], [], []).then((resut: any) => {
      if (resut.Ok) {
        setCreateStatus({ ...createStatus, status: "success" })
      } else {
        switch (Object.keys(resut.Err)[0]) {
          case "FactoryError":
            switch (Object.keys(resut.Err.FactoryError)[0]) {
              case "NotEnoughIcp":
                setCreateStatus({ msg: "Not Enough Icp!", status: "error" })
                break
              default:
                setCreateStatus({ msg: "create Error!", status: "error" })
            }
            break
          case "AlreadyExists":
            setCreateStatus({ msg: "Name Already Exists!", status: "error" })
            break
          default:
            setCreateStatus({ msg: "create Error!", status: "error" })
        }
        throw Error("CBIndex:Create Error!")
      }
    })
  };
  const getSelectTokenArrayFuc = (tokensArray: Array<string>) => {
    setTokens(tokensArray)
    let t = []
    for (let i = 0; i < tokensArray.length; i++) {
      t.push(Principal.fromText(tokensArray[i]))
    }
    setTokensPrincipal(t)
  }
  const refresh = () => {
    setCreateObj({ name: "", symbol: "" })
    setShow(!show)
    setTimeout(() => {
      setShow(true)
    })
  }
  const createOkModalEvt = () => {
    switch (createStatus.status) {
      case "create":
        createVault()
        break
      case "success":
        setCreateModal(false)
        setCreateStatus({ ...createStatus, status: "create" })
        refresh()
        break
      case "error":
        setCreateModal(false)
        setCreateStatus({ ...createStatus, status: "create" })
        refresh()
    }
  }
  return (
    <>
      {wallet ? (
        <div className={classes.createCreateVaultBox}>
          <div className={classes.createCreateInfoBox}>
            <div className={classes.createItem}>
              <div className={classes.title}>Name</div>
              <Input
                onChange={(e) => {
                  setCreateObj({ ...createObj, name: e.target.value });
                }}
                status={!nameStatus ? "error" : ""}
                onBlur={(e) => {
                  if (!e.target.value) return;
                  setNameStatus(rule.test(e.target.value));
                }}
                value={createObj.name}
              />
              {!nameStatus && (
                <div
                  style={{
                    color: "#dc4446",
                  }}
                >
                  Name does not meet the requirements (3-50 characters).
                </div>
              )}
            </div>
            <div className={classes.createItem}>
              <div className={classes.title}>Symbol </div>
              <Input
                onChange={(e) => {
                  setCreateObj({ ...createObj, symbol: e.target.value });
                }}
                value={createObj.symbol}
                status={!symbolStatus ? "error" : ""}
                onBlur={(e) => {
                  if (!e.target.value) return;
                  setSymbolStatus(rule.test(e.target.value));
                }}
              />
              {!symbolStatus && (
                <div
                  style={{
                    color: "#dc4446",
                  }}
                >
                  Symbol does not meet the requirements (3-50 characters).
                </div>
              )}
            </div>
            <div className={classes.createItem}>
              <div className={classes.title}>Supported Tokens</div>
              {show && <MySelect getSelectTokenArrayFuc={getSelectTokenArrayFuc} />}
            </div>
            <div className={classes.createBtn}>
              <Button
                disabled={
                  createObj.name === "" ||
                  createObj.symbol === "" ||
                  !nameStatus ||
                  !symbolStatus || !tokensPrincipal.length
                }
                onClick={() => {
                  setCreateModal(true);
                }}
              >
                Create
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className={classes.noLoginBox}>
          Please connect wallet
        </div>
      )}
      {/*Modal*/}
      <div>
        <Modal
          open={createModal}
          onOk={() => createOkModalEvt()}
          onCancel={() => {
            setCreateModal(false);
            setCreateStatus({ ...createStatus, status: "create" })

          }}
          maskClosable={false}
          cancelButtonProps={{
            style: {
              display: createStatus.status == 'loading' || createStatus.status === 'success' ? "none" : "",
            },
          }}
          okButtonProps={{
            style: {
              display: createStatus.status == 'loading' ? "none" : "",
            },
          }}
          closeIcon={false}
          centered
        >
          {createStatus.status === 'create' && (
            <div>
              <div
                style={{
                  fontSize: "16px",
                  fontWeight: "bold",
                  marginBottom: "10px",
                }}
              >
                Create Active Fund
              </div>
              <div>
                Create a new active fund named {createObj.name} with symbol{" "}
                {createObj.symbol} and supported tokens {tokens.map((it, index) => {
                  if (index === tokens.length - 1) return <span key={it}>{token[it].symbol}</span>
                  return <span key={it}>{token[it].symbol},</span>
                })}.
              </div>
            </div>
          )}
          {createStatus.status == 'loading' && (
            <div className={classes.createFundSpinContainer}>
              <Spin />
              <div className={classes.spinLoadingText}>
                Creating an active fund...
              </div>
            </div>
          )}
          {createStatus.status === 'success' && (
            <>
              <div className={classes.createModalText}>
                Successfully created an active fund! You can find it in "Invest
                in Fund".
              </div>
            </>
          )}
          {createStatus.status === 'error' && (
            <>
              <div className={classes.createModalText}>
                {createStatus.msg ? createStatus.msg : "created Error!"}
              </div>
            </>
          )}
        </Modal>
      </div >
    </>
  );
};
export default CreateVaultPage;
