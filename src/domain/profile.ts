import {nip19} from 'nostr-tools'
import {ellipsize} from 'hurdak'
import {PROFILE} from "@welshman/util"
import type {TrustedEvent} from "@welshman/util"
import {SearchHelper} from "src/util/misc"
import {tryJson} from "src/util/misc"

export type Profile = {
  name?: string
  nip05?: string
  lud06?: string
  lud16?: string
  about?: string
  banner?: string
  picture?: string
  website?: string
  display_name?: string
  event?: TrustedEvent
}

export type PublishedProfile = Omit<Profile, "event"> & {
  event: TrustedEvent
}

export const makeProfile = (profile: Partial<Profile> = {}): Profile => ({
  name: "",
  nip05: "",
  lud06: "",
  lud16: "",
  about: "",
  banner: "",
  picture: "",
  website: "",
  display_name: "",
  ...profile,
})

export const readProfile = (event: TrustedEvent) => {
  const profile = tryJson(() => JSON.parse(event.content)) || {}

  return {...profile, event} as PublishedProfile
}

export const createProfile = ({event, ...profile}: Profile) =>
  ({kind: PROFILE, content: JSON.stringify(profile)})

export const editProfile = ({event, ...profile}: PublishedProfile) =>
  ({kind: PROFILE, content: JSON.stringify(profile), tags: event.tags})

export const displayPubkey = pubkey => {
  const d = nip19.npubEncode(pubkey)

  return d.slice(0, 8) + "…" + d.slice(-5)
}

export const displayProfile = (profile?: Profile) => {
  const {display_name, name, event} = profile || {}

  if (name) ellipsize(name, 60)
  if (display_name) ellipsize(display_name, 60)
  if (event) displayPubkey(event.pubkey)

  return "[no name]"
}

export class ProfileSearch extends SearchHelper<PublishedProfile, string> {
  config = {
    keys: ["name", "display_name", {name: "nip05", weight: 0.5}, {name: "about", weight: 0.1}],
    threshold: 0.3,
    shouldSort: false,
    includeScore: true,
  }

  getValue = (option: PublishedProfile) => option.event.pubkey

  display = (address: string) =>
    displayProfile(this.options.find(profile => this.getValue(profile) === address))
}
