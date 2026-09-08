import {derived, writable} from "svelte/store"
import type {Readable} from "svelte/store"
import {always, noop} from "@welshman/lib"
import type {Maybe} from "@welshman/lib"
import {withGetter, synced, localStorageProvider} from "@welshman/store"
import type {ReadableWithGetter} from "@welshman/store"
import {Resolver, addNoFallbacks} from "@welshman/util"
import type {Filter, RelaySelection} from "@welshman/util"
import type {BaseEventReader, EventWriter, KindFactory} from "@welshman/domain"
import type {ISigner} from "@welshman/signer"
import {
  App,
  BlockedRelayLists,
  BlossomServerLists,
  Deletes,
  Domain,
  Events,
  FeedLists,
  Feeds,
  FollowLists,
  Handles,
  MessagingRelayLists,
  MuteLists,
  Network,
  PinLists,
  Plaintext,
  Profiles,
  Reactions,
  RelayLists,
  RelayStats,
  Relays,
  Router,
  Sync,
  Thunks,
  Topics,
  User,
  Wot,
  Wraps,
  Zappers,
  appPolicyCacheDecrypt,
  appPolicyIngest,
  appPolicyLogSignerMethods,
  appPolicyRelayStats,
  appPolicyWraps,
  defineSessionHandler,
  makeAppPolicyAuth,
  registerSessionHandler,
} from "@welshman/app"
import type {AppPolicy, DerivedPlugin, Plugin, Session} from "@welshman/app"
import {env} from "src/engine/env"

// An App owns a repository, a socket pool and the signer state for exactly one identity, and its
// policies capture that identity when they run, so coracle keeps one app per account and rebuilds
// it on switch rather than reassigning `app.user`.

// Config the user can change at runtime. Settings live in src/engine/state.ts, which imports this
// module, so state writes here instead of core reading from it.
export const appConfig = {
  dufflepudUrl: env.DUFFLEPUD_URL,
  autoAuthenticate: false,
  relayLimit: 10,
}

// Auth unless the relay is blocked, and only when the user has opted in — the welshman default
// omits the second half.
const appPolicyAuth = makeAppPolicyAuth((socket, app) => {
  if (!app.user || !appConfig.autoAuthenticate) {
    return false
  }

  return !app.use(BlockedRelayLists).urls(app.user.pubkey).get().includes(socket.url)
})

// Welshman's router resolves userInbox/userOutbox/userMessaging through User.require, which throws
// when nobody is signed in — so a single user-scoped selection rejects the whole resolution, and
// every feed comes up empty for a logged-out visitor. The routes one layer down already treat a
// missing pubkey as "no relays", so degrade these the same way rather than throwing.
//
// The rebuilt resolver also carries coracle's scenario defaults, so everything that resolves relays
// for itself — a domain writer working out where to publish, a feed, a relay hint — lands on the
// same selection coracle would have made by hand.
const appPolicyRouter: AppPolicy = app => {
  const router = app.use(Router)
  const resolveRoute = router.resolveRoute

  router.resolveRoute = route =>
    !app.user && route.type.startsWith("user") ? [] : resolveRoute(route)

  // The resolver captured the original at construction, so it has to be rebuilt to see the guard
  router.resolver = new Resolver(router.resolveRoute, {
    // A getter, so changing the setting takes effect without rebuilding the app
    get limit() {
      return appConfig.relayLimit
    },
    // Selections never fall back to default relays. Padding a short selection out with relays
    // nobody involved actually reads or writes to mostly wastes requests, and it hides the real
    // problem: when a selection comes back empty, either the user or the person they're addressing
    // has no relays set up.
    // TODO: surface that to the user instead of silently publishing or querying nowhere.
    policy: addNoFallbacks,
    getRelayQuality: url => app.use(RelayStats).getQuality(url),
    getDefaultRelays: app.config.getDefaultRelays,
  })

  return noop
}

// Policy modules can't be imported here (they import this one), so they push themselves in and the
// first app is built lazily, once every module has had a chance to register.
export const appPolicies: AppPolicy[] = [
  appPolicyIngest,
  appPolicyRelayStats,
  appPolicyWraps,
  appPolicyCacheDecrypt,
  appPolicyLogSignerMethods,
  appPolicyAuth,
  appPolicyRouter,
]

const makeApp = (user?: User) =>
  new App({
    user,
    policies: appPolicies,
    config: {
      // A getter, so changing the setting takes effect without rebuilding the app
      get dufflepudUrl() {
        return appConfig.dufflepudUrl
      },
      getDefaultRelays: always(env.DEFAULT_RELAYS),
      getIndexerRelays: always(env.INDEXER_RELAYS),
      getSearchRelays: always(env.SEARCH_RELAYS),
    },
  })

const appStore = withGetter(writable<Maybe<App>>(undefined))

const getApp = () => appStore.get() ?? setApp(makeApp())

const setApp = (instance: App) => {
  appStore.set(instance)

  return instance
}

export const app: ReadableWithGetter<App> = {
  get: getApp,
  subscribe: run => {
    getApp()

    return appStore.subscribe($app => run($app!))
  },
}

// Read a store off the current app, re-subscribing when a login swaps in a new one. Anything bound
// at module load has to go through this or it will keep reading a discarded app.
export const fromApp = <T>(read: ($app: App) => Readable<T>): Readable<T> =>
  derived(app, ($app, set: (value: T) => void) => read($app).subscribe(set))

// Every event query in coracle is this shape, bound to whichever app is current.
export const deriveEvents = (filters: Filter[]) => fromApp($app => $app.use(Events).all(filters).$)

// A plugin bound to the current app, so `$profiles` in a component and `profiles.get()` in a module
// both stay pointed at the right one after a switch.
export const usePlugin = <T>(Ctor: Plugin<T>) => withGetter(derived(app, $app => $app.use(Ctor)))

// The signed-in user's own entry in a keyed collection, e.g. deriveUserItem(Profiles).
export const deriveUserItem = <T>(Ctor: Plugin<DerivedPlugin<T>>): Readable<Maybe<T>> =>
  derived(app, ($app, set: (item: Maybe<T>) => void) => {
    let previous: Maybe<T>

    return $app.use(Ctor).index.$.subscribe($index => {
      const item = $app.user ? $index.get($app.user.pubkey) : undefined

      // The index is a new Map on every repository update, so dedupe or every subscriber re-fires
      if (item !== previous) {
        previous = item
        set(item)
      }
    })
  })

export const blossomServerLists = usePlugin(BlossomServerLists)
export const deletes = usePlugin(Deletes)
export const domain = usePlugin(Domain)
export const events = usePlugin(Events)
export const feedLists = usePlugin(FeedLists)
export const feeds = usePlugin(Feeds)
export const followLists = usePlugin(FollowLists)
export const handles = usePlugin(Handles)
export const messagingRelayLists = usePlugin(MessagingRelayLists)
export const muteLists = usePlugin(MuteLists)
export const network = usePlugin(Network)
export const pinLists = usePlugin(PinLists)
export const plaintext = usePlugin(Plaintext)
export const profiles = usePlugin(Profiles)
export const reactions = usePlugin(Reactions)
export const relayLists = usePlugin(RelayLists)
export const relayStats = usePlugin(RelayStats)
export const relays = usePlugin(Relays)
export const router = usePlugin(Router)
export const sync = usePlugin(Sync)
export const thunks = usePlugin(Thunks)
export const topics = usePlugin(Topics)
export const wot = usePlugin(Wot)
export const wraps = usePlugin(Wraps)
export const zappers = usePlugin(Zappers)

// A pubkey's write relays as of right now. Relay resolution is asynchronous, so callers that need
// relays in a synchronous initializer seed with these and widen once a resolve settles.
export const getWriteRelays = (pubkey: string) => relayLists.get().writeUrls(pubkey).get()

// The searches each live on the plugin that owns the collection they index
export const profileSearch = fromApp($app => $app.use(Profiles).profileSearch)

export const relaySearch = fromApp($app => $app.use(Relays).relaySearch)

export const topicSearch = fromApp($app => $app.use(Topics).topicSearch)

// Domain entry points, since almost every read or write goes through one of them
export const reader = <R extends BaseEventReader, W extends EventWriter<R>>(
  factory: KindFactory<R, W>,
) => domain.get().reader(factory)

export const writer = <R extends BaseEventReader, W extends EventWriter<R>>(
  factory: KindFactory<R, W>,
  seed?: R,
) => domain.get().writer(factory, seed)

export const command = (eventWriter: EventWriter<any>) => domain.get().command(eventWriter)

// Relay selection resolves asynchronously now, since it may have to load relay lists first. The
// resolver carries the limit and the fallback policy, so this is for selections nothing else
// already owns — pass a limit to widen or narrow a single case.
export const resolveRelays = async (
  selections: RelaySelection[],
  {limit}: {limit?: number} = {},
) => {
  const scenario = await router.get().resolve(selections)

  return (limit ? scenario.limit(limit) : scenario).getUrls()
}

// Sessions

// Coracle lets you view the app as someone else without holding their key. Welshman has no
// read-only session — every built-in handler produces a signer — so this is coracle's own: a signer
// that knows a pubkey and refuses everything else.
const readOnlyError = () => Promise.reject(new Error("This account is read-only"))

class ReadOnlySigner implements ISigner {
  constructor(readonly pubkey: string) {}

  getPubkey = async () => this.pubkey

  sign = readOnlyError

  nip04 = {encrypt: readOnlyError, decrypt: readOnlyError}

  nip44 = {encrypt: readOnlyError, decrypt: readOnlyError}
}

export const readOnly = defineSessionHandler({
  method: "readOnly",
  getSigner: (data: {pubkey: string}) => new ReadOnlySigner(data.pubkey),
})

registerSessionHandler(readOnly)

// Keyed by pubkey so the account switcher can rebuild an app for any logged-in account. A session
// is welshman's serializable {method, data}; coracle's own per-account metadata rides alongside it.
export type StoredSession = {
  pubkey: string
  session: Session
}

const sessionsStore = synced<Record<string, StoredSession>>({
  key: "sessions",
  storage: localStorageProvider,
  defaultValue: {},
})

const pubkeyStore = synced<Maybe<string>>({
  key: "pubkey",
  storage: localStorageProvider,
  defaultValue: undefined,
})

export const sessions = withGetter(sessionsStore)

export const pubkey = withGetter(pubkeyStore)

export const session = derived([sessions, pubkey], ([$sessions, $pubkey]) =>
  $pubkey ? $sessions[$pubkey] : undefined,
)

export const signer = derived(app, $app => $app.user?.signer)

// Reading this while signed out throws, so use `$app.user?.pubkey` wherever absence is legitimate
export const user = derived(app, $app => User.require($app))

const setUser = ($user?: User) => {
  appStore.get()?.cleanup()

  return setApp(makeApp($user))
}

// Log in, remembering the session so the account can be switched back to later
export const login = async ($session: Session) => {
  const $user = await User.fromSession($session)

  if (!$user) {
    throw new Error(`Unable to log in using ${$session.method}`)
  }

  sessions.update($sessions => ({
    ...$sessions,
    [$user.pubkey]: {pubkey: $user.pubkey, session: $session},
  }))

  setUser($user)
  pubkey.set($user.pubkey)

  return $user
}

// Rebuild the app around another logged-in account. Its repository starts cold and re-hydrates
// from that account's own database.
export const switchAccount = async ($pubkey: string) => {
  const stored = sessions.get()[$pubkey]

  if (!stored) {
    throw new Error(`No session stored for ${$pubkey}`)
  }

  return login(stored.session)
}

export const logout = () => {
  const $pubkey = pubkey.get()

  if ($pubkey) {
    sessions.update(({[$pubkey]: _, ...rest}) => rest)
  }

  pubkey.set(undefined)
  setUser(undefined)
}

// Restore the last-used account at startup. Sessions hydrate from localStorage asynchronously, and
// the app is built lazily, so nothing constructs an anonymous app before this resolves.
export const restoreSession = async () => {
  await Promise.all([sessionsStore.ready, pubkeyStore.ready])

  const $pubkey = pubkey.get()
  const stored = $pubkey ? sessions.get()[$pubkey] : undefined

  if (!stored) {
    return undefined
  }

  return login(stored.session).catch(noop)
}
