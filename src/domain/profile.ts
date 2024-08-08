import {nip19} from "nostr-tools"
import {ellipsize} from "hurdak"
import {PROFILE} from "@welshman/util"
import type {TrustedEvent} from "@welshman/util"
import {parseJson} from "src/util/misc"

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

export const isPublishedProfile = (profile: Profile): profile is PublishedProfile =>
  Boolean(profile.event)

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
  const profile = parseJson(event.content) || {}

  return {...profile, event} as PublishedProfile
}

export const createProfile = ({event, ...profile}: Profile) => ({
  kind: PROFILE,
  content: JSON.stringify(profile),
})

export const editProfile = ({event, ...profile}: PublishedProfile) => ({
  kind: PROFILE,
  content: JSON.stringify(profile),
  tags: event.tags,
})

export const displayPubkey = pubkey => {
  const d = nip19.npubEncode(pubkey)

  return d.slice(0, 8) + "…" + d.slice(-5)
}

export const displayProfile = (profile?: Profile) => {
  const {display_name, name, event} = profile || {}

  if (name) return ellipsize(name, 60)
  if (display_name) return ellipsize(display_name, 60)
  if (event) return displayPubkey(event.pubkey)

  return "[no name]"
}

export const profileHasName = (profile?: Profile) => Boolean(profile?.name || profile?.display_name)
