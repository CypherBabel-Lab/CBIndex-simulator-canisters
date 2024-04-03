import React from "react";
import { Table } from "antd";
import ShareImg from "../../../../components/ShareImg/ShareImg";
import { AccountIdentifier } from '@dfinity/ledger-icp';
import { Principal } from '@dfinity/principal';
import { localePriceNumber } from '../../../../utils/number/localeNumber'
const DepositorTable = ({ DepositorList, vaultNav }: any) => {
    const columns = [
        {
            title: 'Wallet Address',
            dataIndex: '0',
            key: 'depositor_address',
            render: (text) => {
                return <>{text.owner.toString()}
                    <ShareImg
                        onClick={() => {
                            window.open("https://dashboard.internetcomputer.org/account/" + AccountIdentifier.fromPrincipal({ principal: Principal.fromText(text.owner.toString()) }).toHex())
                        }}
                    />
                </>
            }
        },
        {
            title: 'Shares',
            dataIndex: '1',
            key: 'Shares',
            render: (text: number) => {
                return <>
                    {localePriceNumber((Number(text) / 100000000))}
                </>
            }
        },
        {
            title: 'Balance',
            dataIndex: '1',
            key: 'Balance',
            render: (text: number, row: any) => {
                return <>${localePriceNumber(Number(row["1"]) / 100000000 * vaultNav)} USD</>
                // return <>${Number(((Number(row["1"]) / 100000000) * vaultNav).toFixed(2)).toLocaleString()} USD</>
            }
        },
    ];


    return <>
        <Table dataSource={DepositorList} columns={columns} />
    </>
}

export default DepositorTable;