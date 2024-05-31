import type {TrustedEvent} from "@welshman/util"

export type Encrypt = (x: string) => Promise<string>

export type EventContent = {
  content?: string
  tags?: string[][]
}

export type DecryptedEvent = TrustedEvent & {
  plaintext: EventContent
}

export const asDecryptedEvent = (event: TrustedEvent, plaintext: EventContent) =>
  ({...event, plaintext}) as DecryptedEvent

export class Encryptable {
  constructor(readonly event: Partial<TrustedEvent>, readonly updates: EventContent) {}

  async reconcile(encrypt: Encrypt) {
    const encryptContent = () => {
      if (!this.updates.content) return null

      return encrypt(this.updates.content)
    }

    const encryptTags = () => {
      if (!this.updates.tags) return null

      return Promise.all(
        this.updates.tags.map(async tag => {
          tag[1] = await encrypt(tag[1])

          return tag
        })
      )
    }

    const [content, tags] = await Promise.all([encryptContent(), encryptTags()])

    // Updates are optional. If not provided, fall back to the event's content and tags.
    return {
      ...this.event,
      tags: tags || this.event.tags,
      content: content || this.event.content,
    }
  }
}
