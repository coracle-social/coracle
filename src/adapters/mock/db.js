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
