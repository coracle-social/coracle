import {stripProtocol} from "@welshman/lib"
import type {TrustedEvent} from "@welshman/util"
import {getIdentifier, normalizeRelayUrl} from "@welshman/util"

export const GROUP_DELIMITER = `'`

export const makeGroupId = (url: string, nom: string) =>
  [stripProtocol(url), nom].join(GROUP_DELIMITER)

export const splitGroupId = (groupId: string) => {
  const [url, nom] = groupId.split(GROUP_DELIMITER)

  return [normalizeRelayUrl(url), nom]
}

export const getGroupNom = (e: TrustedEvent) => getIdentifier(e)?.split(GROUP_DELIMITER)[1]

export const getGroupUrl = (e: TrustedEvent) => {
  const id = getIdentifier(e)
  const url = id?.split(GROUP_DELIMITER)[0]

  return url ? normalizeRelayUrl(url) : null
}

export const getGroupName = (e: TrustedEvent | undefined) => e?.tags.find(t => t[0] === "name")?.[1]

export const getGroupPicture = (e: TrustedEvent | undefined) =>
  e?.tags.find(t => t[0] === "picture")?.[1]
