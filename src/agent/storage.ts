import {error} from 'src/util/logger'

// Types

type Message = {
  topic: string
  payload: object
}

// Plumbing

const worker = new Worker(
  new URL('./workers/database.js', import.meta.url),
  {type: 'module'}
)

worker.addEventListener('error', error)

class Channel {
  id: string
  onMessage: (e: MessageEvent) => void
  constructor({onMessage}) {
    this.id = Math.random().toString().slice(2)
    this.onMessage = e => {
      if (e.data.channel === this.id) {
        onMessage(e.data as Message)
      }
    }

    worker.addEventListener('message', this.onMessage)
  }
  close() {
    worker.removeEventListener('message', this.onMessage)
  }
  send(topic, payload) {
    worker.postMessage({channel: this.id, topic, payload})
  }
}

const call = (topic, payload): Promise<Message> => {
  return new Promise(resolve => {
    const channel = new Channel({
      onMessage: message => {
        resolve(message)
        channel.close()
      },
    })

    channel.send(topic, payload)
  })
}

export const lf = async (method, ...args) => {
  const message = await call('localforage.call', {method, args})

  if (message.topic !== 'localforage.return') {
    throw new Error(`callLocalforage received invalid response: ${message}`)
  }

  return message.payload
}
