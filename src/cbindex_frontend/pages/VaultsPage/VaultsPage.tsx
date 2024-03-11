import React, { useEffect, useState } from "react";
import VaultsTable from "./VaultsTable/VaultsTable";
import { createActor } from '../../../declarations/vault/index'
import { useCanister, useWallet } from "@connect2ic/react";

const VaultsPage = () => {
    const [vault_factory] = useCanister("vault_factory")
    const [wallt] = useWallet()
    const [loading, setLoading] = useState(true)
    const [dataSource, setDataSource] = useState([])
    const getVaultList = async () => {
        let getList = await vault_factory.get_vaults() as Array<any>
        let initList = []
        for (let i = 0; i < getList.length; i++) {
            let vault = createActor(getList[i][1].toString())
            let config = await vault.get_config() as any
            config.canisterId = getList[i][1].toString()
            config.owner = config.owner.toString()
            for (let i = 0; i < config.supported_tokens.length; i++) {
                config.supported_tokens[i] = config.supported_tokens[i].canister_id.toString()
            }
            initList.push(config)
        }
        initList.sort((a, b) => Number(b.deploy_time) - Number(a.deploy_time))
        setDataSource(initList)
        setLoading(!loading)
    }
    useEffect(() => {
        getVaultList()
    }, [])

    return <VaultsTable loading={loading} dataSource={dataSource} address={wallt?.principal} />
}

export default VaultsPage