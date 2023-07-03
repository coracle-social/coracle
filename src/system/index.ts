export * from "src/system/env"
import keys from "src/system/keys"
import initSync from "src/system/sync"
import initSocial from "src/system/social"
import initSettings from "src/system/settings"
import initDirectory from "src/system/directory"
import initNip05 from "src/system/nip05"
import initNip57 from "src/system/nip57"
import initContent from "src/system/content"
import initRouting from "src/system/routing"
import initChat from "src/system/chat"
import initAlerts from "src/system/alerts"
import initCmd from "src/system/cmd"
import {getUserWriteRelays} from "src/agent/relays"
import network from "src/agent/network"
import relays from "src/agent/relays"
import pool from "src/agent/pool"

// Hacks for circular deps

const getCmd = () => cmd

// ===========================================================
// Initialize various components

const sync = initSync({keys})
const social = initSocial({keys, sync, getCmd, getUserWriteRelays})
const settings = initSettings({keys, sync, getCmd, getUserWriteRelays})
const directory = initDirectory({keys, sync, sortByGraph: social.sortByGraph})
const nip05 = initNip05({sync, sortByGraph: social.sortByGraph})
const nip57 = initNip57({sync, sortByGraph: social.sortByGraph})
const routing = initRouting({keys, sync, getCmd, sortByGraph: social.sortByGraph})
const chat = initChat({keys, sync, getCmd, getUserWriteRelays})
const alerts = initAlerts({keys, sync, chat, social, isUserEvent: () => false})
const content = initContent({keys, sync, getCmd, getUserWriteRelays})
const cmd = initCmd({keys, sync, pool, displayPubkey: directory.displayPubkey})

// Glue stuff together

network.ext.sync = sync

settings.store.subscribe($settings => {
  pool.Config.multiplextrUrl = $settings.multiplextrUrl
})

pool.ext.routing = routing
relays.ext.routing = routing

// ===========================================================
// Initialization

const initialize = () => {
  routing.initialize()
}

// ===========================================================
// Exports

export {
  keys,
  sync,
  social,
  settings,
  directory,
  nip05,
  nip57,
  routing,
  chat,
  alerts,
  content,
  cmd,
  initialize,
}
