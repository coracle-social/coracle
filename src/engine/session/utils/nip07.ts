import logger from "src/util/logger"

let lock = Promise.resolve()

export const getExtension = () => (window as {nostr?: any}).nostr

export const withExtension = (f: (ext: any) => void) => {
  lock = lock.then(() => f(getExtension())).catch(e => logger.error(e))

  return lock
}
