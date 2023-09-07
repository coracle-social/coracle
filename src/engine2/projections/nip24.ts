import {prop, propEq, find, without, uniqBy, uniq} from "ramda"
import {Tags, appDataKeys} from "src/util/nostr"
import {tryJson} from "src/util/misc"
import type {Event, Channel} from "src/engine2/model"
import {keys, people, channels} from "src/engine2/state"
import {wrapper, nip04, getNip24ChannelId, canSign} from "src/engine2/queries"
import {projections, updateKey} from "src/engine2/projections/core"

projections.addHandler(3, e => {
  updateKey(people.key(e.pubkey), e.created_at, {
    petnames: Tags.from(e).type("p").all(),
  })
})

projections.addHandler(30078, async e => {
  if (!canSign.get()) {
    return
  }

  if (Tags.from(e).getMeta("d") === appDataKeys.NIP24_LAST_CHECKED) {
    await tryJson(async () => {
      const payload = JSON.parse(await nip04.get().decryptAsUser(e.content, e.pubkey))

      for (const id of Object.keys(payload)) {
        const channel = channels.key(id)

        channel.merge({
          last_checked: Math.max(payload[id], channel.get()?.last_checked || 0),
        })
      }
    })
  }
})

projections.addHandler(1059, e => {
  const user = find(propEq("pubkey", Tags.from(e).getMeta("p")), keys.get())

  if (!user?.privkey) {
    return
  }

  const {pubkey, privkey} = user

  wrapper.get().withUnwrappedEvent(e, privkey, (rumor: Event) => {
    if (rumor.kind !== 14) {
      return
    }

    const tags = Tags.from(rumor)
    const pubkeys = without([pubkey], tags.type("p").values().all().concat(rumor.pubkey))
    const channelId = getNip24ChannelId(pubkeys)

    channels.key(channelId).update($channel => {
      const updates = {
        ...$channel,
        id: channelId,
        type: "nip24",
        relays: uniq(tags.relays().concat($channel?.relays || [])),
        messages: uniqBy(prop("id"), [rumor].concat($channel?.messages || [])),
      }

      if (rumor.pubkey === pubkey) {
        updates.last_sent = Math.max(updates.last_sent || 0, rumor.created_at)
      } else {
        updates.last_received = Math.max(updates.last_received || 0, rumor.created_at)
      }

      return updates as Channel
    })
  })
})
