import type {Filter} from "src/engine2/model"
import {getUrls, getExecutor, searchableRelays} from "src/engine2/queries"

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
