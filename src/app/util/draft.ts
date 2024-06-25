import {v4 as uuid} from "uuid"
import {now, identity} from "@welshman/lib"
import type {EventTemplate} from "@welshman/util"
import {NOTE, CLASSIFIED, EVENT_TIME} from '@welshman/util'
import * as Content from '@welshman/content'
import type {Parsed} from '@welshman/content'
import {currencyOptions} from "src/util/i18n"
import {SelfStore, dateToSeconds} from 'src/util/misc'
import {getClientTags, env, hints} from 'src/engine'

export enum DraftError {
  EmptyContent = "empty_content",
  EmptyCurrency = "empty_currency",
  EmptyTitle = "empty_title",
  EmptyTime = "empty_time",
  InvalidPrice = "invalid_price",
  HasNsec = "has_nsec",
}

export type DraftImage = {
  url: string,
  meta: Record<string, string>
}

export type Draft = {
  kind: number
  groups: string[]
  relays: string[]
  warning: string
  anonymous: boolean
  content: Parsed[]
  images: DraftImage[]
  extra: Record<string, any>
}

export const makeDraftNote = (draft: Partial<Draft> = {}): Draft => ({
  kind: NOTE,
  relays: hints.WriteRelays().getUrls(),
  groups: [env.get().FORCE_GROUP].filter(identity),
  warning: "",
  anonymous: false,
  content: [],
  images: [],
  extra: {},
  ...draft,
})

export const makeDraftListing = (draft: Partial<Draft> = {}): Draft => ({
  ...makeDraftNote(),
  kind: CLASSIFIED,
  extra: {
    title: "",
    summary: "",
    price: "",
    currency: currencyOptions.find(o => o.code === "SAT"),
    location: "",
  },
  ...draft,
})

export const makeDraftEvent = (draft: Partial<Draft> = {}): Draft => ({
  ...makeDraftNote(),
  kind: EVENT_TIME,
  extra: {
    title: "",
    location: "",
    start: "",
    end: "",
  },
  ...draft,
})

export const validateDraft = ({kind, content, extra}: Draft) => {
  const errors = []

  if (content.length === 0) {
    errors.push(DraftError.EmptyContent)
  }

  if (kind === EVENT_TIME) {
    if (!extra.title) errors.push(DraftError.EmptyTitle)
    if (!extra.start || !extra.end) errors.push(DraftError.EmptyTime)
  }

  if (kind === CLASSIFIED) {
    if (!extra.title) errors.push(DraftError.EmptyTitle)
    if (isNaN(parseFloat(extra.price))) DraftError.InvalidPrice
    if (!extra.currency) DraftError.EmptyCurrency
  }

  return errors
}

export const createDraft = (draft: Draft): EventTemplate => {
  let tags = getClientTags()

  if (draft.warning) {
    tags.push(["content-warning", draft.warning])
  }

  for (const {url, meta} of draft.images) {
    tags.push(['imeta', ...Object.entries({...meta, url}).map(pair => pair.join(' '))])
  }

  for (const parsed of draft.content) {
    if (Content.isTopic(parsed)) {
      tags.push(["t", parsed.value])
    } else if (Content.isEvent(parsed)) {
      const {id, relays = [], author = ""} = parsed.value

      tags.push(["q", id, relays[0] || "", "mention", author])
    } else if (Content.isProfile(parsed)) {
      const {pubkey, relays = []} = parsed.value

      tags.push(["p", pubkey, relays[0] || "", ""])
    } else if (Content.isAddress(parsed)) {
      const {kind, pubkey, identifier, relays = []} = parsed.value
      const address = [kind, pubkey, identifier].join(":")

      tags.push(["a", address.toString(), relays[0] || ""])
    }
  }

  if (draft.kind === EVENT_TIME) {
    tags = [
      ...tags,
      ["d", uuid()],
      ["title", draft.extra.title],
      ["summary", draft.extra.summary || ""],
      ["location", draft.extra.location || ""],
      ["published_at", now().toString()],
      ["price", draft.extra.price, draft.extra.currency.code],
    ]
  }

  if (draft.kind === CLASSIFIED) {
    tags = [
      ...tags,
      ["d", uuid()],
      ["title", draft.extra.title],
      ["location", draft.extra.location || ""],
      ["start", dateToSeconds(draft.extra.start).toString()],
      ["end", dateToSeconds(draft.extra.end).toString()],
    ]
  }

  return {
    kind: draft.kind,
    created_at: now(),
    content: draft.content.map(p => p.raw).join(''),
    tags,
  }
}

export type DraftControllerOpts = {
  publish: () => void
}

export class DraftController extends SelfStore {
  nsecWarning = false
  skipNsecWarning = false
  content = ""
  counts = {
    words: 0,
    chars: 0
  }

  constructor(readonly draft: Draft, readonly opts: DraftControllerOpts) {
    super()

    this.content = draft.content.map(p => p.raw).join(''),
    this.notify()
  }

  set = draft => {
    Object.assign(this, draft)
    this.notify()
  }

  setKind = (kind: number) => {
    this.draft.kind = kind
    this.notify()
  }

  setContent = (content: string) => {
    this.content = content
    this.counts.chars = content.length || 0
    this.counts.words = content.trim() ? (content.match(/\s+/g)?.length || 0) + 1 : 0
    this.notify()
  }

  clearNsecWarning = () => {
    this.nsecWarning = false
  }

  ignoreNsecWarning = () => {
    this.nsecWarning = false
    this.skipNsecWarning = true
  }

  validate = () => {
    const errors = validateDraft(this.draft)

    if (errors.includes(DraftError.HasNsec) && !this.skipNsecWarning) {
      this.nsecWarning = Boolean(this.content.match(/\bnsec1.+/))
    }

    return errors
  }

  getDraft = () => ({...this.draft, content: Content.parse({content: this.content})})

  getEvent = () => createDraft(this.getDraft())

  publish = () => this.opts.publish()
}
