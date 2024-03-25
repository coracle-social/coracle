import type {Filter} from "@coracle.social/util"

export type DynamicFilter = Omit<Filter, "authors"> & {
  authors?: string[] | "follows" | "network" | "global"
}

export type NostrConnectHandler = {
  pubkey?: string
  domain?: string
  relays?: string[]
}
