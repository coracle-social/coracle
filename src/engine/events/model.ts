import type {Event as NostrToolsEvent, UnsignedEvent} from "nostr-tools"

export type NostrEvent = NostrToolsEvent

export type Event = Omit<NostrToolsEvent, "kind"> & {
  kind: number
  seen_on: string[]
  wrap?: Event
}

export type Rumor = UnsignedEvent & {
  id: string
}

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
  Nip44Message = 14,
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
