import {publishEvent} from "./util"

export const publishUserProfile = ({content, ...opts}) =>
  publishEvent(0, {...opts, content: JSON.stringify(content)})

export const publishNote = opts => publishEvent(1, opts)
