import {get} from 'svelte/store'
import type {SignedEvent} from '@welshman/util'
import {batcher, uniq, now, postJson, assoc} from "@welshman/lib"
import {normalizeRelayUrl, PROFILE, FOLLOWS, MUTES, GROUP_META} from "@welshman/util"
import {subscribe} from "@welshman/net"
import type {RelayInfo, HandleInfo, Session} from "@app/types"
import {splitGroupId} from "@app/domain"
import {DUFFLEPUD_URL, INDEXER_RELAYS, repository, pk, sessions} from "@app/base"
import {relayInfo, handleInfo, groupsById, profilesByPubkey, mutesByPubkey} from "@app/state"

// Session

export const addSession = (session: Session) => {
  sessions.update(assoc(session.pubkey, session))
  pk.set(session.pubkey)
}

// Handle info

export const loadHandleInfo = batcher(800, async (handles: string[]) => {
  const res = await postJson(`${DUFFLEPUD_URL}/handle/info`, {handles: uniq(handles)})
  const data: {handle: string, info: HandleInfo}[] = res?.data || []

  handleInfo.update($handleInfo => {
    for (const {handle, info} of data) {
      $handleInfo.set(handle, {...info, fetched_at: now()})
    }

    return $handleInfo
  })

  return data.map(item => item.info)
})

export const getHandleInfo = (handle: string) => {
  const info = get(handleInfo).get(handle)

  if (info?.fetched_at > now() - 3600) {
    return info
  }

  return loadHandleInfo(handle)
}

// Relay info

export const loadRelayInfo = batcher(800, async (urls: string[]) => {
  const res = await postJson(`${DUFFLEPUD_URL}/relay/info`, {urls: uniq(urls)})
  const data: {url: string, info: RelayInfo}[] = res?.data || []

  relayInfo.update($relayInfo => {
    for (const {url, info} of data) {
      $relayInfo.set(normalizeRelayUrl(url), {...info, fetched_at: now()})
    }

    return $relayInfo
  })

  return data.map(item => item.info)
})

export const getRelayInfo = (url: string) => {
  const info = get(relayInfo).get(url)

  if (info?.fetched_at > now() - 3600) {
    return info
  }

  return loadRelayInfo(url)
}

// Group meta

export const getGroup = (groupId: string) => {
  const group = get(groupsById).get(groupId)

  if (group?.event.fetched_at > now() - 3600) {
    return group
  }

  const [url, nom] = splitGroupId(groupId)

  const sub = subscribe({
    relays: [url],
    filters: [{kinds: [GROUP_META], '#d': [groupId]}],
    closeOnEose: true,
  })

  sub.emitter.on('event', (url: string, e: SignedEvent) => {
    e.fetched_at = now()
    repository.publish(e)
    console.log(e)
  })
}

// Profile

export const getProfile = (pubkey: string, relays = []) => {
  const profile = get(profilesByPubkey).get(pubkey)

  if (profile?.event.fetched_at > now() - 3600) {
    return profile
  }

  return new Promise(resolve => {
    const sub = subscribe({
      relays: [...relays, ...INDEXER_RELAYS],
      filters: [{kinds: [PROFILE], authors: [pubkey]}],
      closeOnEose: true,
    })

    sub.emitter.on('event', (url: string, e: SignedEvent) => {
      e.fetched_at = now()
      repository.publish(e)
      console.log(e)
      resolve(e)
    })

    sub.emitter.on('close', () => resolve(null))
  })
}

// Follows

export const getFollows = (pubkey: string, relays = []) => {
  const follows = get(followsByPubkey).get(pubkey)

  if (follows?.event.fetched_at > now() - 3600) {
    return follows
  }

  return new Promise(resolve => {
    const sub = subscribe({
      relays: [...relays, ...INDEXER_RELAYS],
      filters: [{kinds: [FOLLOWS], authors: [pubkey]}],
      closeOnEose: true,
    })

    sub.emitter.on('event', (url: string, e: SignedEvent) => {
      e.fetched_at = now()
      repository.publish(e)
      console.log(e)
      resolve(e)
    })

    sub.emitter.on('close', () => resolve(null))
  })
}

// Mutes

export const getMutes = (pubkey: string, relays = []) => {
  const mutes = get(mutesByPubkey).get(pubkey)

  if (mutes?.event.fetched_at > now() - 3600) {
    return mutes
  }

  return new Promise(resolve => {
    const sub = subscribe({
      relays: [...relays, ...INDEXER_RELAYS],
      filters: [{kinds: [MUTES], authors: [pubkey]}],
      closeOnEose: true,
    })

    sub.emitter.on('event', (url: string, e: SignedEvent) => {
      e.fetched_at = now()
      repository.publish(e)
      console.log(e)
      resolve(e)
    })

    sub.emitter.on('close', () => resolve(null))
  })
}
