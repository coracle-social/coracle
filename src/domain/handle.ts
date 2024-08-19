import {last} from "@welshman/lib"

export type Handle = {
  pubkey: string
  nip05: string
  nip46: string[]
  relays: string[]
}

export const displayHandle = (handle: Handle) =>
  handle.nip05.startsWith("_@") ? last(handle.nip05.split("@")) : handle.nip05
