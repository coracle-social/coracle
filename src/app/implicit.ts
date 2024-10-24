// Use this for passing state between pages implicitly
const state = new Map<string, any>()

export const setKey = <T>(key: string, value: T) => state.set(key, value)

export const getKey = <T>(key: string) => state.get(key) as T | undefined

export const popKey = <T>(key: string) => {
  const value: T | undefined = state.get(key)

  state.delete(key)

  return value
}
