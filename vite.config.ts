import { defineConfig } from "vite"
import reactRefresh from "@vitejs/plugin-react-refresh"
import path from "path"
import dfxJson from "./dfx.json"
import fs from "fs"
// process.env["DFX_NETWORK"] !== "ic"
const isDev = true

type Network = "ic" | "local"

interface CanisterIds {
  [key: string]: { [key in Network]: string }
}

let canisterIds: CanisterIds
try {
  canisterIds = JSON.parse(
    fs
      .readFileSync(
        isDev ? ".dfx/local/canister_ids.json" : "./canister_ids.json",
      )
      .toString(),
  )
} catch (e) {
  console.error("\n⚠️  Before starting the dev server run: dfx deploy\n\n")
}

const aliases = Object.entries(dfxJson.canisters).reduce(
  (acc, [name, _value]) => {
    // Get the network name, or `local` by default.
    const networkName = process.env["DFX_NETWORK"] ?? "local"
    const outputRoot = path.join(
      __dirname,
      ".dfx",
      networkName,
      "canisters",
      name,
    )
    return {
      ...acc,
      ["canisters/" + name]: path.join(outputRoot, "index" + ".js"),
    }
  },
  {},
)

const canisterDefinitions = Object.entries(canisterIds).reduce(
  (acc, [key, val]) => ({
    ...acc,
    [`process.env.${key.toUpperCase()}_CANISTER_ID`]: isDev
      ? JSON.stringify(val.local)
      : JSON.stringify(val.ic),
  }),
  {},
)

const DFX_PORT = dfxJson.networks.local.bind.split(":")[1]

export default defineConfig({
  build: {
    target: ["esnext"], // 👈 build.target
  },
  plugins: [reactRefresh()],
  resolve: {
    alias: {
      ...aliases,
    },
  },
  server: {
    fs: {
      allow: ["."],
    },
    proxy: {
      "/api": {
        target: `http://0.0.0.0:${DFX_PORT}`,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, "/api"),
      },
    },
  },
  define: {
    ...canisterDefinitions,
    "process.env.NODE_ENV": JSON.stringify(
      isDev ? "development" : "production",
    ),
  },
})
