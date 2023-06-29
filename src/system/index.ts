export * from "src/system/env"
import keys from "src/system/keys"
import initSync from "src/system/sync"
import initSocial from "src/system/social"
import initSettings from "src/system/settings"
import initNip05 from "src/system/nip05"
import initNip57 from "src/system/nip57"
import {getUserWriteRelays} from "src/agent/relays"
import {default as agentSync} from "src/agent/sync"
import pool from "src/agent/pool"
import cmd from "src/agent/cmd"

// ===========================================================
// Initialize various components

const sync = initSync({keys})
const social = initSocial({keys, sync, cmd, getUserWriteRelays})
const settings = initSettings({keys, sync, cmd, getUserWriteRelays})
const nip05 = initNip05({sync, sortByGraph: social.sortByGraph})
const nip57 = initNip57({sync, sortByGraph: social.sortByGraph})

// Glue stuff together

agentSync.addHandler("ALL_KINDS", sync.processEvents)

settings.store.subscribe($settings => {
  pool.Config.multiplextrUrl = $settings.multiplextrUrl
})

// ===========================================================
// Exports

export {keys, sync, social, settings, nip05, nip57}
