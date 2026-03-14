// Adapted from https://raw.githubusercontent.com/EmilTholin/svelte-routing/master/src/history.js
// Modified for hash-based routing (IPFS compatibility)

const getHashPath = source => {
  const hash = source.location.hash || "#/"
  const path = hash.slice(1) || "/"
  const qIndex = path.indexOf("?")
  return {
    pathname: qIndex >= 0 ? path.slice(0, qIndex) : path,
    search: qIndex >= 0 ? path.slice(qIndex) : "",
  }
}

const getLocation = source => {
  const {pathname, search} = getHashPath(source)
  return {
    ...source.location,
    pathname,
    search,
    state: source.history.state,
    key: (source.history.state && source.history.state.key) || "initial",
  }
}

const createHistory = source => {
  const listeners = []
  let location = getLocation(source)

  return {
    get location() {
      return location
    },

    listen(listener) {
      listeners.push(listener)

      const popstateListener = () => {
        location = getLocation(source)
        listener({location, action: "POP"})
      }

      source.addEventListener("popstate", popstateListener)
      source.addEventListener("hashchange", popstateListener)

      return () => {
        source.removeEventListener("popstate", popstateListener)
        source.removeEventListener("hashchange", popstateListener)
        const index = listeners.indexOf(listener)
        listeners.splice(index, 1)
      }
    },

    navigate(
      to,
      {state = {}, replace = false, preserveScroll = false, blurActiveElement = true} = {},
    ) {
      const hashTo = "#" + to
      // try...catch iOS Safari limits to 100 pushState calls
      try {
        if (replace) source.history.replaceState(state, "", hashTo)
        else source.history.pushState(state, "", hashTo)
      } catch (e) {
        source.location[replace ? "replace" : "assign"](hashTo)
      }
      location = getLocation(source)
      listeners.forEach(listener => listener({location, action: "PUSH", preserveScroll}))

      // @ts-ignore
      if (blurActiveElement) document.activeElement.blur()
    },
  }
}

// Stores history entries in memory for testing or other platforms like Native
const createMemorySource = (initialPathname = "/") => {
  let index = 0
  const stack = [{pathname: initialPathname, search: ""}]
  const states = []

  return {
    get location() {
      return stack[index]
    },
    addEventListener(name, fn) {},
    removeEventListener(name, fn) {},
    history: {
      get entries() {
        return stack
      },
      get index() {
        return index
      },
      get state() {
        return states[index]
      },
      pushState(state, _, uri) {
        const [pathname, search = ""] = uri.split("?")
        index++
        stack.push({pathname, search})
        states.push(state)
      },
      replaceState(state, _, uri) {
        const [pathname, search = ""] = uri.split("?")
        stack[index] = {pathname, search}
        states[index] = state
      },
    },
  }
}
// Global history uses window.history as the source if available,
// otherwise a memory history
const globalHistory = createHistory(window)
const {navigate} = globalHistory

export {globalHistory, navigate, createHistory, createMemorySource}
