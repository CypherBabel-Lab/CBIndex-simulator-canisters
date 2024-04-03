import React, { useEffect } from "react"
import { createClient } from "@connect2ic/core"
import { defaultProviders } from "@connect2ic/core/providers"
import { PlugWallet } from "@connect2ic/core/providers/plug-wallet"
import { ConnectDialog, Connect2ICProvider } from "@connect2ic/react"
import "@connect2ic/core/style.css"
import VaultsPage from './pages/VaultsPage/VaultsPage'
import * as vault_factory from '../declarations/vault_factory'
import * as icp_ledger_canister from '../declarations/icp_ledger_canister'
import * as ckbtc_ledger_canister from '../declarations/ckbtc'
import * as cketh_ledger_canister from '../declarations/cketh'
import * as SwapFactory from '../declarations/SwapFactory'
import * as vault from '../declarations/vault'
import { ConfigProvider, theme } from "antd";
import Layout from "./components/Layout/Layout/Layout"
import { Routes, Route, } from "react-router-dom"
import DetailsPage from "./pages/DetailsPage/DetailsPage"
import CreateActiveFund from "./pages/CreateVaultPage/CreateVaultPage"
import SwapPage from "./pages/SwapPage/SwapPage"
import { BrowserRouter, Navigate } from 'react-router-dom';
import NotificationPage from './pages/NotificationPage/NotificationPage'
import * as notification from '../declarations/notification'

const provider = new PlugWallet({
  dev: true,
  whitelist: [],
  host: window.location.origin,
})
const client = createClient({
  canisters: {
    vault_factory,
    icp_ledger_canister,
    ckbtc_ledger_canister,
    cketh_ledger_canister,
    SwapFactory,
    notification
  },
  providers: [provider],
  globalProviderConfig: {
    dev: true,
    // host: window.location.origin,
  },
})

function App() {
  return (

    <div className="App">
      <Routes>
        <Route path="/vaults" element={<VaultsPage />}></Route>
        <Route path="/createactivefund" element={< CreateActiveFund />}></Route>
        <Route path="/details" element={<DetailsPage />}></Route>
        <Route path="/notification" element={<NotificationPage />}></Route>
        <Route path="*" element={<Navigate to="/vaults" replace />} />
      </Routes>
      <ConnectDialog />
    </div>

  )
}

export default () => (
  <Connect2ICProvider client={client}>
    <BrowserRouter>
      <ConfigProvider
        theme={{
          algorithm: theme.darkAlgorithm,
          token: {
            colorPrimary: "#50F6BF",
          },
          components: {
            Table: {
              borderRadius: 4,
              borderRadiusLG: 6,
              colorBgContainer: "transparent",
              fontSize: 14,
              rowHoverBg: "var(--bg-third-hover-color)",
              colorText: "var(--text-third-color)",
            },
            Button: {
              colorText: "var(--text-third-color)",
              colorBorder: "var(--border-third-color)",
              colorBgContainer: "transparent",
              textHoverBg: "#fff",
              borderRadius: ("var(--border-radius-lg)" as any),
            },

            Select: {
              colorText: "var(--text-third-color)",
              colorBorder: "var(--border-third-color)",
              colorBgContainer: "transparent",
            },
            Popover: {
              colorBgElevated: "rgba(48,48,48, 0.9)",
            },
          },
        }}
      >
        <Layout>
          <App />
        </Layout>
      </ConfigProvider>
    </BrowserRouter>
  </Connect2ICProvider>
)
