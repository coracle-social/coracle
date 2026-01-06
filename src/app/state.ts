import {writable, get} from "svelte/store"
import {uniq} from "@welshman/lib"
import {
  FEEDS,
  Address,
  APP_DATA,
  getAddressTagValues,
  getIdFilters,
  getListTags,
} from "@welshman/util"
import {Router, addMaximalFallbacks} from "@welshman/router"
import {
  pubkey,
  loadUserRelayList,
  loadUserMessagingRelayList,
  loadUserBlossomServerList,
  loadUserProfile,
  loadUserFollowList,
  loadUserMuteList,
  getFollows,
} from "@welshman/app"
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
  // Load relays, then load everything else so we have a better chance of finding it
  const $pubkey = pubkey.get()

  // Load relay selections first
  await loadUserRelayList()

  // Load other crucial user data
  await Promise.all([
    loadUserMessagingRelayList(),
    loadUserBlossomServerList(),
    loadUserProfile(),
    loadUserFollowList(),
    loadUserMuteList(),
  ])

  // Load user feed selections, app data, and feeds that were favorited by the user
  myLoad({
    relays: Router.get().FromUser().policy(addMaximalFallbacks).getUrls(),
    filters: [
      {authors: [$pubkey], kinds: [FEEDS]},
      {
        authors: [$pubkey],
        kinds: [APP_DATA],
        "#d": Object.values(appDataKeys),
      },
    ],
  }).then(() => {
    const addrs = getAddressTagValues(getListTags(get(userFeedFavorites)))
    const pubkeys = uniq(addrs.map(a => Address.from(a).pubkey))

    myLoad({
      relays: Router.get().FromPubkeys(pubkeys).policy(addMaximalFallbacks).getUrls(),
      filters: getIdFilters(addrs),
    })
  })

  // Load enough to figure out web of trust
  loadPubkeys(getFollows($pubkey))

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
