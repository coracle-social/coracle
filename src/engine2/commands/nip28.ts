import {channels} from "src/engine2/state"
import {selectHints, getSetting} from "src/engine2/queries"
import {publishEvent} from "./util"

export const publishNip28ChannelMeta = ({id = null, content}) =>
  publishEvent(id ? 41 : 40, {
    content: JSON.stringify(content),
    tags: id ? [["e", id]] : [],
  })

export const publishNip28Message = ({channelId, content}) => {
  const channel = channels.key(channelId).get()
  const relays = selectHints(getSetting("relay_limit"), channel?.relays || [])

  return publishEvent(42, {content, tags: [["e", channelId, relays[0], "root"]]})
}
