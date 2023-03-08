import {writable} from "svelte/store"

export const logs = writable([])

const logAndAppend = (level, ...message) => {
  logs.update($logs => $logs.concat({created_at: Date.now(), message}).slice(-100))
  console[level](...message)
}

export const log = (...message) => logAndAppend("log", ...message)
export const warn = (...message) => logAndAppend("warn", ...message)
export const error = (...message) => logAndAppend("error", ...message)
