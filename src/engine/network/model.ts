export type Filter = {
  ids?: string[]
  kinds?: number[]
  authors?: string[]
  since?: number
  until?: number
  limit?: number
  search?: string
  [key: `#${string}`]: string[]
}

export type DynamicFilter = Omit<Filter, "authors"> & {
  authors?: string[] | "follows" | "network" | "global"
}
