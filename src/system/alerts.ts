import {sortBy} from "ramda"
import {synced} from "src/util/misc"
import {Tags, isLike, findReplyId, findRootId} from "src/util/nostr"
import {derived} from "svelte/store"
import {Table, watch} from "src/util/loki"

export default ({keys, sync, chat, social, isUserEvent}) => {
  const events = new Table("alerts/events", "id", {sort: sortBy(e => -e.created_at)})
  const lastChecked = synced("notifications/lastChecked", 0)
  const latestNotification = synced("notifications/latestNotification", 0)

  const isMention = e => Tags.from(e).type("p").values().all().includes(keys.getPubkey())
  const isReply = e => isUserEvent(findReplyId(e))
  const isDescendant = e => isUserEvent(findRootId(e))

  const handleNotification = condition => e => {
    if (!keys.getPubkey()) {
      return
    }

    if (e.pubkey === keys.getPubkey()) {
      return
    }

    if (!condition(e)) {
      return
    }

    if (social.isMuted(e)) {
      return
    }

    if (!events.get(e.id)) {
      events.patch(e)
    }
  }

  sync.addHandler(
    1,
    handleNotification(e => isMention(e) || isReply(e) || isDescendant(e))
  )
  sync.addHandler(
    7,
    handleNotification(e => isLike(e.content) && isReply(e))
  )
  sync.addHandler(9735, handleNotification(isReply))

  const messageIsNew = ({last_checked, last_received, last_sent}) =>
    last_received > Math.max(last_sent || 0, last_checked || 0)

  const hasNewNotfications = derived(
    [lastChecked, latestNotification],
    ([$lastChecked, $latestNotification]) => $latestNotification > $lastChecked
  )

  const hasNewDirectMessages = watch(chat.channels, () => {
    const channels = chat.channels.all({type: "private", last_sent: {$type: "number"}})

    return channels.filter(messageIsNew).length > 0
  })

  const hasNewChatMessages = watch(chat.channels, () => {
    const channels = chat.channels.all({type: "public", joined: true})

    return channels.filter(messageIsNew).length > 0
  })

  return {
    events,
    lastChecked,
    latestNotification,
    messageIsNew,
    hasNewNotfications,
    hasNewDirectMessages,
    hasNewChatMessages,
  }
}
