import React, { useEffect, useState } from "react";
import VaultsTable from "./VaultsTable/VaultsTable";
import { createActor } from '../../../declarations/vault/index'
import { useCanister } from "@connect2ic/react";
const VaultsPage = () => {
    const [vault_factory] = useCanister("vault_factory")
    const [loading, setLoading] = useState(true)
    const [dataSource, setDataSource] = useState([])
    const getVaultList = async () => {
        let getList = await vault_factory.get_vaults() as Array<any>
        let initList = []
        for (let i = 0; i < getList.length; i++) {
            let vault = createActor(getList[i].toString())
            let config = await vault.get_config() as any
            config.canisterId = getList[i].toString()
            initList.push(config)
        }
        initList.sort((a, b) => Number(b.deploy_time) - Number(a.deploy_time))
        setDataSource(initList)
        setLoading(!loading)
    }
    useEffect(() => {
        getVaultList()
    }, [])
    return <div>
        <VaultsTable loading={loading} dataSource={dataSource} />
    </div >
}

export default VaultsPage