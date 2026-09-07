import {writable, get} from "svelte/store"
import {noop, uniq} from "@welshman/lib"
import {
  FEEDS,
  Address,
  APP_DATA,
  addMaximalFallbacks,
  getIdFilters,
  outbox,
  userOutbox,
} from "@welshman/util"
import {
  BlossomServerLists,
  FollowLists,
  MessagingRelayLists,
  MuteLists,
  Profiles,
  RelayLists,
  Wot,
} from "@welshman/app"
import {app, resolveRelays} from "src/engine/core"
import {appDataKeys} from "src/util/nostr"
import {router} from "src/app/util/router"
import {
  env,
  myLoad,
  loadPubkeys,
  loadDeletes,
  loadMessages,
  loadNotifications,
  loadFeedsAndLists,
  listenForNotifications,
  userFeedFavorites,
  getSetting,
  setChecked,
} from "src/engine"

export const drafts = new Map<string, any>()

export const menuIsOpen = writable(false)

export const searchTerm = writable("")

export const logUsage = async (path: string) => {
  if (getSetting("report_analytics")) {
    const {location, plausible} = window as any
    const pathname = path.replace(/(npub|nprofile|note|nevent|naddr)1[^\/]+/g, (_, m) => `<${m}>`)

    plausible("pageview", {u: location.origin + pathname})
  }
}

export const slowConnections = writable([])

// Synchronization from events to state

export const loadUserData = async () => {
  const $app = app.get()
  const $pubkey = $app.user?.pubkey

  if (!$pubkey) return

  // Relay selections decide where everything else gets loaded from, so they go first. Loaders
  // reject now rather than swallowing failures, and a failure here must not stop the rest.
  await $app.use(RelayLists).load($pubkey).catch(noop)

  // Load other crucial user data
  await Promise.all([
    $app.use(MessagingRelayLists).load($pubkey).catch(noop),
    $app.use(BlossomServerLists).load($pubkey).catch(noop),
    $app.use(Profiles).load($pubkey).catch(noop),
    $app.use(FollowLists).load($pubkey).catch(noop),
    $app.use(MuteLists).load($pubkey).catch(noop),
  ])

  // Load user feed selections, app data, and feeds that were favorited by the user
  myLoad({
    relays: await resolveRelays([userOutbox()], {policy: addMaximalFallbacks}),
    filters: [
      {authors: [$pubkey], kinds: [FEEDS]},
      {
        authors: [$pubkey],
        kinds: [APP_DATA],
        "#d": Object.values(appDataKeys),
      },
    ],
  })
    .then(async () => {
      const addrs = get(userFeedFavorites)?.addresses() || []
      const pubkeys = uniq(addrs.map(a => Address.from(a).pubkey))

      myLoad({
        relays: await resolveRelays(
          pubkeys.map(pk => outbox(pk)),
          {policy: addMaximalFallbacks},
        ),
        filters: getIdFilters(addrs),
      }).catch(noop)
    })
    .catch(noop)

  // Load enough to figure out web of trust
  loadPubkeys($app.use(Wot).follows($pubkey).get())

  // Load our platform pubkey so we can zap it
  loadPubkeys([env.PLATFORM_PUBKEY])

  // Load anything they might need to be notified about
  loadMessages()
  loadNotifications()
  loadFeedsAndLists()
  loadDeletes()

  // Start listening for notifications
  listenForNotifications()
}

export const boot = () => {
  router.at("login/connect").open({noEscape: true, mini: true})
  setChecked("*")
}
