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

export const appConfig = {
  dufflepudUrl: env.DUFFLEPUD_URL,
  autoAuthenticate: false,
  relayLimit: 10,
}

const appPolicyAuth = makeAppPolicyAuth((socket, app) => {
  if (!app.user || !appConfig.autoAuthenticate) {
    return false
  }

  return !app.use(BlockedRelayLists).urls(app.user.pubkey).get().includes(socket.url)
})

const appPolicyRouter: AppPolicy = app => {
  const router = app.use(Router)
  const resolveRoute = router.resolveRoute

  router.resolveRoute = route =>
    !app.user && route.type.startsWith("user") ? [] : resolveRoute(route)

  router.resolver = new Resolver(router.resolveRoute, {
    get limit() {
      return appConfig.relayLimit
    },
    // An empty selection means the user or the person they're addressing has no relays set up.
    // TODO: surface that instead of silently publishing or querying nowhere.
    policy: addNoFallbacks,
    getRelayQuality: url => app.use(RelayStats).getQuality(url),
    getDefaultRelays: app.config.getDefaultRelays,
  })

  return noop
}

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

export const fromApp = <T>(read: ($app: App) => Readable<T>): Readable<T> =>
  derived(app, ($app, set: (value: T) => void) => read($app).subscribe(set))

export const deriveEvents = (filters: Filter[]) => fromApp($app => $app.use(Events).all(filters).$)

export const usePlugin = <T>(Ctor: Plugin<T>) => withGetter(derived(app, $app => $app.use(Ctor)))

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

export const getWriteRelays = (pubkey: string) => relayLists.get().writeUrls(pubkey).get()

export const profileSearch = fromApp($app => $app.use(Profiles).profileSearch)

export const relaySearch = fromApp($app => $app.use(Relays).relaySearch)

export const topicSearch = fromApp($app => $app.use(Topics).topicSearch)

export const reader = <R extends BaseEventReader, W extends EventWriter<R>>(
  factory: KindFactory<R, W>,
) => domain.get().reader(factory)

export const writer = <R extends BaseEventReader, W extends EventWriter<R>>(
  factory: KindFactory<R, W>,
  seed?: R,
) => domain.get().writer(factory, seed)

export const command = (eventWriter: EventWriter<any>) => domain.get().command(eventWriter)

export const resolveRelays = async (
  selections: RelaySelection[],
  {limit}: {limit?: number} = {},
) => {
  const scenario = await router.get().resolve(selections)

  return (limit ? scenario.limit(limit) : scenario).getUrls()
}

// Sessions

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

export const user = derived(app, $app => User.require($app))

const setUser = ($user?: User) => {
  appStore.get()?.cleanup()

  return setApp(makeApp($user))
}

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

export const restoreSession = async () => {
  await Promise.all([sessionsStore.ready, pubkeyStore.ready])

  const $pubkey = pubkey.get()
  const stored = $pubkey ? sessions.get()[$pubkey] : undefined

  if (!stored) {
    return undefined
  }

  return login(stored.session).catch(noop)
}
