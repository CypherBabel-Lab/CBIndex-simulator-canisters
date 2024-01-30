import React, { useEffect } from "react"
import { createClient } from "@connect2ic/core"
import { defaultProviders } from "@connect2ic/core/providers"
import { ConnectDialog, Connect2ICProvider } from "@connect2ic/react"
import "@connect2ic/core/style.css"
import VaultsPage from './pages/VaultsPage/VaultsPage'
import * as vault_factory from '../declarations/vault_factory'
import * as icp_ledger_canister from '../declarations/icp_ledger_canister'
import { ConfigProvider, theme } from "antd";
import Layout from "./components/Layout/Layout/Layout"
import { Routes, Route, } from "react-router-dom"
import DetailsPage from "./pages/DetailsPage/DetailsPage"
import CreateActiveFund from "./pages/CreateVaultPage/CreateVaultPage"
import { BrowserRouter, Navigate } from 'react-router-dom';
function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/vaults" element={<VaultsPage />}></Route>
        <Route path="/createactivefund" element={< CreateActiveFund />}></Route>
        <Route path="/details" element={< DetailsPage />}></Route>
        <Route path="*" element={<Navigate to="/vaults" replace />} />
      </Routes>
      <ConnectDialog />
    </div>
  )
}
const client = createClient({
  canisters: {
    vault_factory,
    icp_ledger_canister
  },
  providers: defaultProviders,
  globalProviderConfig: {
    dev: import.meta.env.DEV,
  },
})
export default () => (
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
      <Connect2ICProvider client={client}>
        <Layout>
          <App />
        </Layout>
      </Connect2ICProvider>
    </ConfigProvider>
  </BrowserRouter>
)
