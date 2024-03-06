import {assoc, without, uniq, map} from "ramda"
import {createMapOf} from "hurdak"
import {now, createEvent} from "paravel"
import {generatePrivateKey, appDataKeys} from "src/util/nostr"
import {Publisher, getClientTags, mention} from "src/engine/network/utils"
import {hints} from "src/engine/relays/utils"
import {user, signer, nip59, nip04} from "src/engine/session/derived"
import {setAppData} from "src/engine/session/commands"
import {channels} from "./state"

export const sendLegacyMessage = async (channelId: string, content: string) => {
  const recipients = without([user.get().pubkey], channelId.split(","))

  if (recipients.length > 1) {
    throw new Error("Attempted to send legacy message to more than 1 recipient")
  }

  const [pubkey] = recipients
  const template = createEvent(4, {
    content: await nip04.get().encryptAsUser(content, pubkey),
    tags: [mention(pubkey), ...getClientTags()],
  })

  return Publisher.publish({
    event: await signer.get().signAsUser(template),
    relays: hints.PublishMessage(pubkey).getUrls(),
  })
}

export const sendMessage = async (channelId: string, content: string) => {
  const recipients = channelId.split(",")
  const template = {
    content,
    kind: 14,
    created_at: now(),
    tags: [...recipients.map(mention), ...getClientTags()],
  }

  for (const pubkey of uniq(recipients.concat(user.get().pubkey))) {
    const rumor = await nip59.get().wrap(template, {
      wrap: {
        author: generatePrivateKey(),
        recipient: pubkey,
      },
    })

    Publisher.publish({
      event: rumor.wrap,
      relays: hints.merge(recipients.map(hints.PublishMessage)).getUrls(),
    })
  }
}

export const publishChannelsRead = () =>
  setAppData(appDataKeys.NIP24_LAST_CHECKED, createMapOf("id", "last_checked", channels.get()))

export const markAllChannelsRead = () => {
  // @ts-ignore
  channels.update(map(assoc("last_checked", now())))

  publishChannelsRead()
}

export const markChannelRead = (pubkey: string) => {
  channels.key(pubkey).update(assoc("last_checked", now()))

  publishChannelsRead()
}
