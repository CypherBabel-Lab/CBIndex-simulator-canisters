import React from 'react';
import { Select, Space } from 'antd';
import type { SelectProps } from 'antd';
const options: SelectProps['options'] = [
    { value: "ss2fx-dyaaa-aaaar-qacoq-cai", label: "CKETH" },
    { value: "mxzaz-hqaaa-aaaar-qaada-cai", label: "CKBTC" },
    { value: "rxdbk-dyaaa-aaaaq-aabtq-cai", label: "NUA" },
    { value: "jwcfb-hyaaa-aaaaj-aac4q-cai", label: "OGY" },
    { value: "2ouva-viaaa-aaaaq-aaamq-cai", label: "CHAT" },
];
const MySelect = ({ getSelectTokenArrayFuc }: any) => {
    return <Space style={{ width: '100%' }} direction="vertical">
        <Select
            mode="multiple"
            allowClear
            style={{ width: '100%' }}
            placeholder="Please select"
            onChange={getSelectTokenArrayFuc}
            options={options}
        />
    </Space>
}

export default MySelect;