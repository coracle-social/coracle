import {assocPath, path, prop, fromPairs, pluck} from "ramda"
import {appDataKeys} from "src/util/nostr"
import {now} from "src/util/misc"
import {channels} from "src/engine2/state"
import {selectHints} from "src/engine2/queries"
import {publishEvent} from "./util"
import {setAppData} from "./nip78"

export const publishNip28ChannelCreate = content =>
  publishEvent(40, {content: JSON.stringify(content)})

export const publishNip28ChannelUpdate = (id, content) =>
  publishEvent(41, {content: JSON.stringify(content), tags: [["e", id]]})

export const publishNip28Message = (id, content) => {
  const channel = channels.key(id).get()
  const [hint] = selectHints(channel?.relays || [])

  return publishEvent(42, {content, tags: [["e", id, hint, "root"]]})
}

export const publishNip28ChannelChecked = (id: string) => {
  const lastChecked = fromPairs(
    channels
      .get()
      .filter(prop("last_checked"))
      .map(r => [r.id, r.last_checked])
  )

  return setAppData(appDataKeys.NIP28_LAST_CHECKED, {...lastChecked, [id]: now()})
}

export const saveNip28Channels = () =>
  setAppData(
    appDataKeys.NIP28_ROOMS_JOINED,
    pluck("id", channels.get().filter(path(["nip28", "joined"])))
  )

export const joinNip28Channel = (id: string) => {
  channels.key(id).update(assocPath(["nip28", "joined"], true))

  return saveNip28Channels()
}

export const leaveNip28Channel = (id: string) => {
  channels.key(id).update(assocPath(["nip28", "joined"], false))

  return saveNip28Channels()
}
