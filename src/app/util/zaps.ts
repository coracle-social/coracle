import {writable} from "svelte/store"
import {identity} from "@welshman/lib"
import type {TrustedEvent, Zap} from "@welshman/util"
import {getTagValues, getLnUrl, zapFromEvent} from "@welshman/util"
import {loadProfile, loadZapper} from "@welshman/app"

export const getLnUrlsForEvent = async (event: TrustedEvent) => {
  const lnurls = getTagValues("zap", event.tags).map(getLnUrl)

  if (lnurls.length > 0) {
    return lnurls
  }

  const profile = await loadProfile(event.pubkey)

  return profile.lnurl ? [profile.lnurl] : []
}

export const getZapperForZap = async (zap: TrustedEvent, parent: TrustedEvent) => {
  const lnurls = await getLnUrlsForEvent(parent)

  return lnurls.length > 0 ? loadZapper(lnurls[0]) : undefined
}

export const getValidZap = async (zap: TrustedEvent, parent: TrustedEvent) => {
  const zapper = await getZapperForZap(zap, parent)

  return zapper ? zapFromEvent(zap, zapper) : undefined
}

export const getValidZaps = async (zaps: TrustedEvent[], parent: TrustedEvent) => {
  const validatedZaps = await Promise.all(zaps.map(zap => getValidZap(zap, parent)))

  return validatedZaps.filter(identity)
}

export const deriveValidZaps = (zaps: TrustedEvent[], parent: TrustedEvent) => {
  const store = writable<Zap[]>([])

  getValidZaps(zaps, parent).then(validZaps => {
    store.set(validZaps)
  })

  return store
}
