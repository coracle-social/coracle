import logger from "src/util/logger"

let lock = Promise.resolve()

export const getExtension = () => (window as {nostr?: any}).nostr

export const withExtension = (f: (ext: any) => void) => {
  lock = lock.then(() => f(getExtension())).catch(e => {
    // Hide a weird error
    if (!e.toString().match(/Malformed UTF-8/)) {
      logger.error(e)
    }
  })

  return lock
}
