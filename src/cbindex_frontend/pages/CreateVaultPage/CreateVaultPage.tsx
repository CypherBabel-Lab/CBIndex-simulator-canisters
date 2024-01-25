import React, { useEffect, useState } from "react";
import { Input, Select, Button, Modal, Spin } from "antd";
import classes from "./style.module.less";
import { useWallet } from "@connect2ic/react"
import { InitArgs } from '../../../declarations/vault_factory/vault_factory.did'
import { Principal } from '@dfinity/principal';
const rule = /^[a-zA-Z0-9]{3,50}$/;
import { useCanister } from "@connect2ic/react";
const CreateVaultPage = () => {
  const [vault_factory] = useCanister("vault_factory")
  const options = [
    { value: "123", label: "DAI" },
  ];
  const [createObj, setCreateObj] = useState({
    name: "",
    symbol: "",
    asset: "123"
  });
  const [wallet] = useWallet()
  const [createModal, setCreateModal] = useState(false);
  const [createStatus, setCreateStatus] = useState({
    status: "create"
  })
  const [nameStatus, setNameStatus] = useState(true);
  const [symbolStatus, setSymbolStatus] = useState(true);
  const createNewVault = async () => {
    setCreateStatus({ status: "loading" })
    if (!wallet) return
    const initArgs: InitArgs = {
      decimals: [], // 代币的小数位数，设置为空数组
      token_symbol: createObj.symbol, // 代币的符号
      transfer_fee: BigInt(100), // 转账手续费，使用 number 类型
      metadata: [], // 元数据，设置为空数组
      minting_account: {
        owner: Principal.fromText(wallet.principal), // 替换为实际的 Principal
        subaccount: [], // 或者提供 Uint8Array 或 number[] 类型的值，设置为空数组
      },
      initial_balances: [
        [
          {
            owner: Principal.fromText(wallet.principal), // 替换为实际的 Principal
            subaccount: [], // 或者提供 Uint8Array 或 number[] 类型的值，设置为空数组
          },
          BigInt(1),
        ],
        // 添加更多账户和余额...
      ],
      maximum_number_of_accounts: [], // 设置为空数组
      accounts_overflow_trim_quantity: [], // 设置为空数组
      fee_collector_account: [], // 设置为空数组
      archive_options: {
        num_blocks_to_archive: BigInt(100),
        max_transactions_per_response: [],
        trigger_threshold: BigInt(0),
        max_message_size_bytes: [],
        cycles_for_archive_creation: [],
        node_max_memory_size_bytes: [],
        controller_id: Principal.fromText(wallet.principal)
      },
      max_memo_length: [], // 设置为空数组
      token_name: createObj.name, // 替换为实际的代币名称
      feature_flags: [{ 'icrc2': true }], // 使用对象而非数组
    };
    // 调用 create_vault 方法
    const controllers = [Principal.fromText(wallet.principal)]; // 填充实际的 Principal 数组
    try {
      const resut = await vault_factory.create_vault(initArgs, controllers, [], []) as any
      if (resut.Ok) {
        setCreateStatus({ status: "success" })
      } else {
        setCreateStatus({ status: "error" })
      }
    } catch (e) {
      console.log(e);
    }
  };
  return (
    <>
      {true ? (
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
              <div className={classes.title}>Symbol</div>
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
              <div className={classes.title}>Denomination Asset</div>
              <Select
                options={options}
                onChange={(v) => {
                  setCreateObj({ ...createObj, asset: v });
                }}
              />
            </div>
            <div className={classes.createBtn}>
              <Button
                disabled={
                  createObj.name === "" ||
                  createObj.symbol === "" ||
                  !nameStatus ||
                  !symbolStatus
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
          {/* Please connect to wallet and switch to the {JSON.parse(localStorage.getItem("chainInfo") as any).chainConf.networkName} */}
        </div>
      )}
      {/*Modal*/}
      <div>
        <Modal
          open={createModal}
          onOk={() => {
            console.log("createModal");
            console.log(createStatus.status);

            switch (createStatus.status) {
              case "create":
                createNewVault()
                break
              case "success":
                setCreateModal(false)
                setCreateStatus({ status: "create" })
                setCreateObj({
                  name: "",
                  symbol: "",
                  asset: "123"
                })
                break
              case "error":
                setCreateModal(false)
                setCreateStatus({ status: "create" })
                setCreateObj({
                  name: "",
                  symbol: "",
                  asset: "123"
                })

            }
          }}
          onCancel={() => {
            setCreateModal(false);
            setCreateStatus({ status: "create" })
          }}
          maskClosable={false}
          cancelButtonProps={{
            style: {
              display: createStatus.status == 'loading' ? "none" : "",
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
                {createObj.symbol} and denomination asset DAI.
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
                created Error!
              </div>
            </>
          )}
        </Modal>
      </div>
    </>
  );
};
export default CreateVaultPage;
