export * from "src/system/env"
import keys from "src/system/keys"
import initSync from "src/system/sync"
import initSocial from "src/system/social"
import initSettings from "src/system/settings"
import {getUserWriteRelays} from "src/agent/relays"
import {default as agentSync} from "src/agent/sync"
import pool from "src/agent/pool"
import cmd from "src/agent/cmd"

// ===========================================================
// Initialize various components

const sync = initSync({keys})
const social = initSocial({keys, sync, cmd, getUserWriteRelays})
const settings = initSettings({keys, sync, cmd, getUserWriteRelays})

// Glue stuff together

agentSync.addHandler("ALL_KINDS", sync.processEvents)

settings.store.subscribe($settings => {
  pool.Config.multiplextrUrl = $settings.multiplextrUrl
})

// ===========================================================
// Exports

export {keys, sync, social, settings}
