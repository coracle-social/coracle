import {get} from "svelte/store"
import {synced, getter} from "src/util/misc"
import {Tags} from "src/util/nostr"
import {DUFFLEPUD_URL, MULTIPLEXTR_URL} from "src/system/env"

export default ({keys, sync, cmd, getUserWriteRelays}) => {
  const store = synced("settings/store", {
    lastUpdated: 0,
    relayLimit: 20,
    defaultZap: 21,
    showMedia: true,
    reportAnalytics: true,
    dufflepudUrl: DUFFLEPUD_URL,
    multiplextrUrl: MULTIPLEXTR_URL,
  })

  sync.addHandler(30078, async e => {
    if (
      Tags.from(e).getMeta("d") === "coracle/settings/v1" &&
      e.created_at > getSetting("lastUpdated")
    ) {
      const updates = await keys.decryptJson(e.content)

      if (updates) {
        store.set({...getSettings(), ...updates, lastUpdated: e.created_at})
      }
    }
  })

  const getSettings = getter(store)
  const getSetting = k => getSettings()[k]
  const dufflepud = path => `${getSetting("dufflepudUrl")}${path}`

  const setSettings = async settings => {
    store.update($settings => ({...$settings, ...settings}))

    if (get(keys.canSign)) {
      const d = "coracle/settings/v1"
      const v = await keys.encryptJson(settings)

      return cmd.setAppData(d, v).publish(getUserWriteRelays())
    }
  }

  return {
    store,
    getSettings,
    getSetting,
    dufflepud,
    setSettings,
  }
}
