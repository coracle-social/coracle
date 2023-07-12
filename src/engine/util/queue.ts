export const queue = () => {
  let timeout
  const queue = []
  const handlers = []

  const doWork = async () => {
    for (const message of queue.splice(0, 50)) {
      for (const handler of handlers) {
        await handler(message)
      }
    }

    timeout = undefined

    enqueueWork()
  }

  const enqueueWork = () => {
    if (!timeout && queue.length > 0) {
      timeout = setTimeout(doWork, 50)
    }
  }

  const push = message => {
    queue.push(message)
    enqueueWork()
  }

  const listen = handler => {
    handlers.push(handler)
  }

  return {push, listen}
}
