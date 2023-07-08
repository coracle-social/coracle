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
import initCache from "src/system/cache"
import initChat from "src/system/chat"
import initAlerts from "src/system/alerts"
import initCmd from "src/system/cmd"
import Network from "src/system/network"
import initMeta from "src/system/meta"

// Hacks for circular deps

const getCmd = () => cmd
const getUserWriteRelays = () => routing.getUserRelayUrls("write")
const isUserEvent = id => cache.events.get(id)?.pubkey === keys.getPubkey()

// ===========================================================
// Initialize various components

const sync = initSync({keys})
const social = initSocial({keys, sync, getCmd, getUserWriteRelays})
const settings = initSettings({keys, sync, getCmd, getUserWriteRelays})
const directory = initDirectory({keys, sync, sortByGraph: social.sortByGraph})
const nip05 = initNip05({sync, sortByGraph: social.sortByGraph})
const nip57 = initNip57({sync, sortByGraph: social.sortByGraph})
const routing = initRouting({keys, sync, getCmd, sortByGraph: social.sortByGraph})
const cache = initCache({keys, sync, social})
const chat = initChat({keys, sync, getCmd, getUserWriteRelays})
const alerts = initAlerts({keys, sync, chat, social, isUserEvent})
const content = initContent({keys, sync, getCmd, getUserWriteRelays})
const network = new Network({sync, settings, routing})
const cmd = initCmd({keys, sync, network, routing, displayPubkey: directory.displayPubkey})
const meta = initMeta({network})

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
  cache,
  chat,
  alerts,
  content,
  cmd,
  initialize,
  network,
  meta,
}
