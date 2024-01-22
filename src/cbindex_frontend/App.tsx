import React from "react"
/*
 * Connect2ic provides essential utilities for IC app development
 */
import { createClient } from "@connect2ic/core"
import { NFID } from "@connect2ic/core/providers/nfid"
import { defaultProviders } from "@connect2ic/core/providers"
import { ConnectButton, ConnectDialog, Connect2ICProvider } from "@connect2ic/react"
import "@connect2ic/core/style.css"
/*
 * Import canister definitions like this:
 */
import * as counter from "../declarations/vault"
/*
 * Some examples to get you started
 */
import { Counter } from "./components/Counter"
import { Transfer } from "./components/Transfer"
import { Profile } from "./components/Profile"
import Layout from "./components/Layout/Layout/Layout"
import { Routes, Route, Link } from "react-router-dom"
import CreateActiveFund from "./pages/CreateActiveFund"
import Vaults from './pages/Vaults'
{/* <div className="App">
  <ConnectDialog />
  <header className="App-header">
    <img src={logo} className="App-logo" alt="logo" />
    <p className="slogan">
      React+TypeScript Template
    </p>
    <p className="twitter">by <a href="https://twitter.com/miamaruq">@miamaruq</a></p>
  </header>

  <p className="examples-title">
    Examples
  </p>
  <div className="examples">
  
    <Profile />
    <Transfer />
  </div>
</div> */}
function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/vaults" element={<Counter />}></Route>
        <Route path="/createactivefund" element={<CreateActiveFund />}></Route>
      </Routes>
      <ConnectDialog />
      <Profile />
      <Transfer />
    </div>
  )
}

const provider = new NFID({
  // boolean
  dev: true,
  // The app name
  appName: "my-ic-app",
  // whitelisted canisters
  whitelist: [],
  // The url for the providers frontend
  providerUrl: "https://nfid.one",
  // The host used for canisters
  host: window.location.origin,
})
const client = createClient({
  canisters: {
    counter,
  },
  providers: defaultProviders,
  globalProviderConfig: {
    dev: import.meta.env.DEV,
  },
})

export default () => (
  <Connect2ICProvider client={client}>
    <Layout>
      <App />
    </Layout>
  </Connect2ICProvider>
)
