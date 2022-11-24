import {Dexie} from "dexie"

export const db = new Dexie("coracle/db", {})

db.version(2).stores({
  relays: "url",
  events: "id, pubkey",
})

db
  .open()
  .then(async db => {
    console.log("Database ready")
  })
  .catch(err => {
    console.error(err)
  })

export const registerRelay = async url => {
  let json
  try {
    const res = await fetch(url.replace(/^ws/, 'http'), {
      headers: {
        Accept: 'application/nostr_json',
      },
    })

    json = await res.json()
  } catch (e) {
    json = {}
  }

  db.relays.put({...json, url})
}

registerRelay('wss://nostr-pub.wellorder.net')
registerRelay('wss://nostr-relay.wlvs.space')
registerRelay('ws://localhost:7000')
