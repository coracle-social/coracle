import {writable} from "svelte/store"
import {uniq} from "@welshman/lib"
import {COMMUNITIES, FEEDS, APP_DATA} from "@welshman/util"
import {
  pubkey,
  loadZapper,
  loadHandle,
  loadRelaySelections,
  getRelayUrls,
  loadProfile,
  loadFollows,
  loadMutes,
  getFollows,
  loadInboxRelaySelections,
} from "@welshman/app"
import {appDataKeys} from "src/util/nostr"
import {router} from "src/app/util/router"
import {
  env,
  load,
  loadPubkeys,
  loadSeen,
  loadDeletes,
  loadHandlers,
  loadMessages,
  loadNotifications,
  loadFeedsAndLists,
  listenForNotifications,
  getSetting,
} from "src/engine"

export const drafts = new Map<string, string>()

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

export const loadAppData = () => {
  // If we have a group, load that
}

export const loadUserData = async (hints: string[] = []) => {
  // Load relays, then load everything else so we have a better chance of finding it
  const $pubkey = pubkey.get()
  const relaySelections = await loadRelaySelections($pubkey, {relays: hints})
  const relays = uniq([...hints, ...getRelayUrls(relaySelections)])

  // Load crucial user data
  await Promise.all([
    loadInboxRelaySelections($pubkey, {relays}),
    loadProfile($pubkey, {relays}),
    loadFollows($pubkey, {relays}),
    loadMutes($pubkey, {relays}),
  ])

  // Load less important user data
  loadZapper($pubkey)
  loadHandle($pubkey)
  load({
    relays,
    filters: [
      {authors: [$pubkey], kinds: [COMMUNITIES, FEEDS]},
      {
        authors: [$pubkey],
        kinds: [APP_DATA],
        "#d": Object.values(appDataKeys),
      },
    ],
  })

  // Load enough to figure out web of trust
  loadPubkeys(getFollows($pubkey))

  // Load our platform pubkey so we can zap it
  loadPubkeys([env.PLATFORM_PUBKEY])

  // Load anything they might need to be notified about
  loadSeen()
  loadMessages()
  loadNotifications()
  loadFeedsAndLists()
  loadHandlers()
  loadDeletes()

  // Start listening for notifications
  listenForNotifications()
}

export const boot = () => router.at("login/connect").open({noEscape: true})
