import {Address, BOOKMARKS, NAMED_BOOKMARKS, getAddress} from "@welshman/util"
import type {TrustedEvent} from "@welshman/util"
import {BookmarkList} from "@welshman/domain"
import type {BookmarkListReader, BookmarkListWriter} from "@welshman/domain"
import {DerivedPlugin, Domain, Network, User} from "@welshman/app"
import type {IApp} from "@welshman/app"
import {EDITABLE_LIST_KINDS, mapListToFeed, readUserList, userListKind} from "src/domain"
import type {PublishedListFeed, PublishedUserList, UserListReader} from "src/domain"
import {RELAY_FEEDS} from "src/util/nostr"

// A list whose only tag is its identifier is an empty shell — usually what's left after
// everything was removed from it — so don't show it as a list at all.
const hasEntries = (event: TrustedEvent) => event.tags.length > 1

/**
 * NIP-51 lists the user can edit, keyed by address. All of these kinds are
 * parameterized-replaceable, so the address is the list's identity — the same list
 * republished doesn't become a second entry.
 */
export class Lists extends DerivedPlugin<PublishedUserList> {
  constructor(app: IApp) {
    super(app, {
      filters: [{kinds: EDITABLE_LIST_KINDS}],
      eventToItem: (event: TrustedEvent) => (hasEntries(event) ? readUserList(event) : undefined),
      getKey: list => getAddress(list.event),
    })
  }

  fetch(address: string, relayHints: string[] = []) {
    const {kind, pubkey, identifier} = Address.from(address)

    return this.app
      .use(Network)
      .loadUsingOutbox(pubkey, {kinds: [kind], "#d": [identifier]}, relayHints)
  }
}

/**
 * NIP-51 bookmark sets (kind 30003) presented as feeds, keyed by address.
 */
export class ListFeeds extends DerivedPlugin<PublishedListFeed> {
  constructor(app: IApp) {
    super(app, {
      filters: [{kinds: [NAMED_BOOKMARKS]}],
      eventToItem: async (event: TrustedEvent) =>
        hasEntries(event) ? mapListToFeed(await readUserList(event)) : undefined,
      getKey: feed => getAddress(feed.event),
    })
  }

  fetch(address: string, relayHints: string[] = []) {
    const {pubkey, identifier} = Address.from(address)

    return this.app
      .use(Network)
      .loadUsingOutbox(pubkey, {kinds: [NAMED_BOOKMARKS], "#d": [identifier]}, relayHints)
  }
}

/**
 * Coracle's list of relays to show as feeds (kind 10012), keyed by pubkey since the kind is
 * replaceable rather than parameterized.
 */
export class RelayFeedLists extends DerivedPlugin<UserListReader> {
  constructor(app: IApp) {
    super(app, {
      filters: [{kinds: [RELAY_FEEDS]}],
      eventToItem: app.use(Domain).reader(userListKind(RELAY_FEEDS)),
      getKey: list => list.author(),
    })
  }

  fetch(pubkey: string, relayHints: string[] = []) {
    return this.app.use(Network).loadUsingOutbox(pubkey, {kinds: [RELAY_FEEDS]}, relayHints)
  }
}

/**
 * NIP-51 bookmark lists (kind 10003), keyed by pubkey. Private entries are NIP-44 encrypted,
 * so they're only readable for the user's own list.
 */
export class BookmarkLists extends DerivedPlugin<BookmarkListReader> {
  constructor(app: IApp) {
    super(app, {
      filters: [{kinds: [BOOKMARKS]}],
      eventToItem: app.use(Domain).reader(BookmarkList),
      getKey: list => list.author(),
    })
  }

  fetch(pubkey: string, relayHints: string[] = []) {
    return this.app.use(Network).loadUsingOutbox(pubkey, {kinds: [BOOKMARKS]}, relayHints)
  }

  update = async (fn: (writer: BookmarkListWriter) => void) => {
    const user = User.require(this.app)
    const writer = this.app.use(Domain).writer(BookmarkList, await this.forceLoad(user.pubkey))

    fn(writer)

    return this.app.use(Domain).command(writer)
  }

  bookmarkPublicly = (tag: string[]) => this.update(writer => writer.bookmarkPublicly(tag))

  removeBookmark = (value: string) => this.update(writer => writer.removeBookmark(value))
}
