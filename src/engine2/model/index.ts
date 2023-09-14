import type {Event as NostrToolsEvent, UnsignedEvent} from "nostr-tools"

// Message types

export enum EventKind {
  Profile = 0,
  Note = 1,
  RecommendRelay = 2,
  Petnames = 3,
  Nip04Message = 4,
  Delete = 5,
  Repost = 6,
  Reaction = 7,
  BadgeAward = 8,
  GenericRepost = 16,
  ChannelCreation = 40,
  ChannelMetadata = 41,
  ChannelMessage = 42,
  ChannelHideMessage = 43,
  ChannelMuteUser = 44,
  GiftWrap = 1059,
  FileMetadata = 1063,
  LiveChatMessage = 1311,
  Report = 1984,
  Label = 1985,
  CommunityPostApproval = 4550,
  ZapGoal = 9041,
  ZapRequest = 9734,
  Zap = 9735,
  MuteList = 10000,
  PinList = 10001,
  RelayList = 10002,
  WalletInfo = 13194,
  ClientAuth = 22242,
  WalletRequest = 23194,
  WalletResponse = 23195,
  NostrConnect = 24133,
  HTTPAuth = 27235,
  PeopleList = 30000,
  BookmarkList = 30001,
  ProfileBadges = 30008,
  BadgeDefinition = 30009,
  Post = 30023,
  PostDraft = 30024,
  AppData = 30078,
  LiveEvent = 30311,
  UserStatus = 30315,
  Classified = 30402,
  ClassifiedDraft = 30403,
  CalendarEventDate = 31922,
  CalendarEventTime = 31923,
  Calendar = 31924,
  CalendarRSVP = 31925,
  HandlerRecommendation = 31989,
  HandlerInformation = 31990,
  CommunityDefinition = 34550,
}

export type NostrEvent = NostrToolsEvent

export type Event = Omit<NostrToolsEvent, "kind"> & {
  kind: number
  seen_on: string[]
  wrap?: Event
}

export type Rumor = UnsignedEvent & {
  id: string
}

export type ZapEvent = Event & {
  invoiceAmount: number
  request: Event
}

export type DisplayEvent = Event & {
  zaps: Event[]
  replies: DisplayEvent[]
  reactions: Event[]
  matchesFilter?: boolean
}

export type Filter = {
  ids?: string[]
  kinds?: number[]
  authors?: string[]
  since?: number
  until?: number
  limit?: number
  search?: string
  [key: `#${string}`]: string[]
}

export type DynamicFilter = Omit<Filter, "authors"> & {
  authors?: string[] | "follows" | "network" | "global"
}

// Domain types

export type Session = {
  method: string
  pubkey: string
  privkey?: string
  bunkerKey?: string
  bunkerToken?: string
  settings?: Record<string, any>
  settings_updated_at?: number
}

export type RelayInfo = {
  contact?: string
  description?: string
  last_checked?: number
  supported_nips?: number[]
  limitation?: {
    payment_required?: boolean
    auth_required?: boolean
  }
}

export type Relay = {
  url: string
  count?: number
  first_seen?: number
  info?: RelayInfo
}

export enum RelayMode {
  Read = "read",
  Write = "write",
}

export type RelayPolicy = {
  url: string
  read: boolean
  write: boolean
}

export type Profile = {
  name?: string
  nip05?: string
  lud16?: string
  about?: string
  banner?: string
  picture?: string
  display_name?: string
}

export type Handle = {
  profile: Record<string, any>
  pubkey: string
  address: string
}

export type Zapper = {
  lnurl: string
  callback: string
  minSendable: number
  maxSendable: number
  nostrPubkey: string
}

export type Person = {
  pubkey: string
  last_fetched?: number
  profile_updated_at?: number
  profile?: Profile
  petnames_updated_at?: number
  petnames?: string[][]
  mutes_updated_at?: number
  mutes?: string[][]
  relays_updated_at?: number
  relays?: RelayPolicy[]
  handle_updated_at?: number
  handle?: Handle
  zapper_updated_at?: number
  zapper?: Zapper
}

export type Channel = {
  id: string
  type: "nip28" | "nip04" | "nip44"
  relays: string[]
  messages: Event[]
  last_sent?: number
  last_received?: number
  last_checked?: number
  meta_updated_at?: number
  meta?: {
    name?: string
    about?: string
    picture?: string
  }
  nip28?: {
    owner?: string
    joined?: string
  }
}

export type Topic = {
  name: string
  count?: number
  last_seen?: number
}

export type Delete = {
  value: string
  created_at: number
}

export type List = {
  name: string
  naddr: string
  pubkey: string
  tags_updated_at: number
  tags: string[][]
}

export type Notification = {
  key: string
  event: Event
  timestamp: number
  interactions: Event[]
}
