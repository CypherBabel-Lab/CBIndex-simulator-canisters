import React from 'react'
import shareIcon from '../../public/icon/share.png'
const ShareImg = ({ onClick }) => {
    return <img src={shareIcon} width={15} height={15} alt="Block"
        style={{
            marginLeft: "5px",
            cursor: "pointer",
        }}
        onClick={() => {
            onClick()
        }}
    />
}

export default ShareImg