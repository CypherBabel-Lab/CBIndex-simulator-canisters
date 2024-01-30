import React from 'react';
import { Select, Space } from 'antd';
import type { SelectProps } from 'antd';
import Token from '../../utils/tokenInfo/token.json'
import style from './style.module.less'
const options: SelectProps['options'] = [
    {
        value: "ss2fx-dyaaa-aaaar-qacoq-cai",
        label: <div className={style.labelItem}>
            <img src={Token["ss2fx-dyaaa-aaaar-qacoq-cai"].icon} alt="iconImg" className='iconImg' />
            CKETH
        </div>
    },
    {
        value: "mxzaz-hqaaa-aaaar-qaada-cai",
        label: <div className={style.labelItem}>
            <img src={Token["mxzaz-hqaaa-aaaar-qaada-cai"].icon} alt="iconImg" className='iconImg' />
            CKBTC
        </div>
    },
    {
        value: "rxdbk-dyaaa-aaaaq-aabtq-cai",
        label: <div className={style.labelItem}>
            <img src={Token["rxdbk-dyaaa-aaaaq-aabtq-cai"].icon} alt="iconImg" className='iconImg' />
            NUA
        </div>
    },
    {
        value: "jwcfb-hyaaa-aaaaj-aac4q-cai",
        label: <div className={style.labelItem}>
            <img src={Token["jwcfb-hyaaa-aaaaj-aac4q-cai"].icon} alt="iconImg" className='iconImg' />
            OGY
        </div>
    },
    {
        value: "2ouva-viaaa-aaaaq-aaamq-cai",
        label: <div className={style.labelItem}>
            <img src={Token["2ouva-viaaa-aaaaq-aaamq-cai"].icon} alt="iconImg" className='iconImg' />
            CHAT
        </div>
    },
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