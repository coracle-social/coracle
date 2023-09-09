import {publishEvent} from "./util"

export const publishNip28ChannelMeta = ({id = null, content}) =>
  publishEvent(id ? 41 : 40, {
    content: JSON.stringify(content),
    tags: id ? [["e", id]] : [],
  })
