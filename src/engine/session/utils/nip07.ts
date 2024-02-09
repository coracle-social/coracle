import logger from "src/util/logger"

let lock = Promise.resolve()

export const getExtension = () => (window as {nostr?: any}).nostr

export const withExtension = (f: (ext: any) => void) => {
  lock = lock.catch(e => logger.error(e)).then(() => f(getExtension()))

  return lock
}
