import React from "react";
import { Table } from "antd";
// import FormatTime from "../../components/Time/FormatTime";
const DepositorTable = ({ DepositorList }: any) => {
    const columns = [
        {
            title: 'Wallet Address',
            dataIndex: '0',
            key: 'depositor_address',
            render: (text) => {
                console.log(text);
                return <>{text.owner.toString()}</>
            }
        },
        {
            title: 'Shares',
            dataIndex: '1',
            key: 'Shares',
            render: (text: number) => {
                console.log(Number(text) / 100000000);
                return <>{(Number(text) / 100000000)}</>
            }
        },
    ];


    return <>
        <Table dataSource={DepositorList} columns={columns} />
    </>
}

export default DepositorTable;