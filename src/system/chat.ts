import {last, sortBy, pick, uniq, fromPairs, pluck, without} from "ramda"
import {get} from "svelte/store"
import {tryJson, tryFunc} from "src/util/misc"
import {Tags, channelAttrs} from "src/util/nostr"
import {Table} from "src/util/loki"

export default ({keys, sync, getCmd, getUserWriteRelays}) => {
  const channels = new Table("chat/channels", "id", {
    sort: sortBy(x => {
      if (x.joined || x.type === "private") return 0
      if (!x.name || x.name.match(/test/i)) return Infinity

      return x.updated_at
    }),
  })

  const messages = new Table("chat/messages", "id", {
    sort: xs => {
      const channelIds = new Set(
        pluck("id", channels.all({$or: [{joined: true}, {type: "private"}]}))
      )

      return sortBy(x => (channelIds.has(x.id) ? 0 : x.created_at), xs)
    },
  })

  const getHints = e => pluck("url", Tags.from(e).relays())

  sync.addHandler(40, e => {
    const channel = channels.get(e.id)

    if (e.created_at < channel?.updated_at) {
      return
    }

    const content = tryJson(() => pick(channelAttrs, JSON.parse(e.content)))

    if (!content?.name) {
      return
    }

    channels.patch({
      id: e.id,
      type: "public",
      pubkey: e.pubkey,
      updated_at: e.created_at,
      hints: getHints(e),
      ...content,
    })
  })

  sync.addHandler(41, e => {
    const channelId = Tags.from(e).getMeta("e")

    if (!channelId) {
      return
    }

    const channel = channels.get(channelId)

    if (e.created_at < channel?.updated_at) {
      return
    }

    if (e.pubkey !== channel?.pubkey) {
      return
    }

    const content = tryJson(() => pick(channelAttrs, JSON.parse(e.content)))

    if (!content?.name) {
      return
    }

    channels.patch({
      id: channelId,
      type: "public",
      pubkey: e.pubkey,
      updated_at: e.created_at,
      hints: getHints(e),
      ...content,
    })
  })

  sync.addHandler(30078, async e => {
    if (Tags.from(e).getMeta("d") === "coracle/last_checked/v1") {
      await tryJson(async () => {
        const payload = await keys.decryptJson(e.content)

        for (const key of Object.keys(payload)) {
          // Backwards compat from when we used to prefix id/pubkey
          const channelId = last(key.split("/"))
          const channel = channels.get(channelId)
          const last_checked = Math.max(payload[channelId], channel?.last_checked || 0)

          // A bunch of junk got added to this setting. Integer keys, settings, etc
          if (isNaN(last_checked) || last_checked < 1577836800) {
            continue
          }

          channels.patch({id: channelId, last_checked})
        }
      })
    }
  })

  sync.addHandler(30078, async e => {
    if (Tags.from(e).getMeta("d") === "coracle/rooms_joined/v1") {
      await tryJson(async () => {
        const channelIds = await keys.decryptJson(e.content)

        // Just a bug from when I was building the feature, remove someday
        if (!Array.isArray(channelIds)) {
          return
        }

        channels.all({type: "public"}).forEach(channel => {
          if (channel.joined && !channelIds.includes(channel.id)) {
            channels.patch({id: channel.id, joined: false})
          } else if (!channel.joined && channelIds.includes(channel.id)) {
            channels.patch({id: channel.id, joined: true})
          }
        })
      })
    }
  })

  sync.addHandler(4, async e => {
    if (!get(keys.canSign)) {
      return
    }

    const author = e.pubkey
    const recipient = Tags.from(e).type("p").values().first()

    if (![author, recipient].includes(keys.getPubkey())) {
      return
    }

    if (messages.get(e.id)) {
      return
    }

    await tryFunc(async () => {
      const crypt = keys.getCrypt()
      const other = keys.getPubkey() === author ? recipient : author

      messages.patch({
        id: e.id,
        channel: other,
        pubkey: e.pubkey,
        created_at: e.created_at,
        content: await crypt.decrypt(other, e.content),
        tags: e.tags,
      })

      if (keys.getPubkey() === author) {
        const channel = channels.get(recipient)

        channels.patch({
          id: recipient,
          type: "private",
          last_sent: e.created_at,
          hints: uniq(getHints(e).concat(channel?.hints || [])),
        })
      } else {
        const channel = channels.get(author)

        channels.patch({
          id: author,
          type: "private",
          last_received: e.created_at,
          hints: uniq(getHints(e).concat(channel?.hints || [])),
        })
      }
    })
  })

  sync.addHandler(42, e => {
    if (messages.get(e.id)) {
      return
    }

    const tags = Tags.from(e)
    const channelId = tags.getMeta("e")
    const channel = channels.get(channelId)
    const hints = uniq(pluck("url", tags.relays()).concat(channel?.hints || []))

    messages.patch({
      id: e.id,
      channel: channelId,
      pubkey: e.pubkey,
      created_at: e.created_at,
      content: e.content,
      tags: e.tags,
    })

    if (keys.getPubkey() === e.pubkey) {
      channels.patch({
        id: channelId,
        type: "public",
        last_sent: e.created_at,
        hints,
      })
    } else {
      channels.patch({
        id: channelId,
        type: "public",
        last_received: e.created_at,
        hints,
      })
    }
  })

  const setAppData = async (key, content) => {
    if (get(keys.canSign)) {
      const d = `coracle/${key}`
      const v = await keys.encryptJson(content)

      return getCmd().setAppData(d, v).publish(getUserWriteRelays())
    }
  }

  const setLastChecked = (channelId, timestamp) => {
    const lastChecked = fromPairs(
      channels.all({last_checked: {$type: "number"}}).map(r => [r.id, r.last_checked])
    )

    return setAppData("last_checked/v1", {...lastChecked, [channelId]: timestamp})
  }

  const joinChannel = channelId => {
    const channelIds = uniq(pluck("id", channels.all({joined: true})).concat(channelId))

    return setAppData("rooms_joined/v1", channelIds)
  }

  const leaveChannel = channelId => {
    const channelIds = without([channelId], pluck("id", channels.all({joined: true})))

    return setAppData("rooms_joined/v1", channelIds)
  }

  return {
    channels,
    messages,
    setLastChecked,
    joinChannel,
    leaveChannel,
  }
}
