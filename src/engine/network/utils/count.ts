import type {Filter} from "src/engine/network/model"
import {searchableRelays} from "src/engine/relays/derived"
import {getUrls, getExecutor} from "./executor"

export const count = async (filters: Filter[]) => {
  const executor = getExecutor(getUrls(searchableRelays.get()))

  return new Promise(resolve => {
    const sub = executor.count(filters, {
      onCount: (url: string, {count}: {count: number}) => resolve(count),
    })

    setTimeout(() => {
      resolve(0)
      sub.unsubscribe()
      executor.target.cleanup()
    }, 3000)
  })
}
