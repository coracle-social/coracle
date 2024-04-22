import {takeWhile, find, filter, identity, mergeLeft, reject} from "ramda"
import {first, randomId, filterVals} from "hurdak"
import {writable} from "@welshman/lib"
import logger from "src/util/logger"
import {buildQueryString, parseQueryString, updateIn} from "src/util/misc"
import {globalHistory} from "src/util/history"

// Adapted from https://github.com/EmilTholin/svelte-routing/blob/master/src/utils.js

const PARAM = /^:(.+)/
const SEGMENT_POINTS = 4
const STATIC_POINTS = 3
const DYNAMIC_POINTS = 2
const SPLAT_PENALTY = 1
const ROOT_POINTS = 1

const segmentize = uri => uri.replace(/(^\/+|\/+$)/g, "").split("/")

const rankRoute = (route, index) => {
  const score = route.default
    ? 0
    : segmentize(route.path).reduce((score, segment) => {
        score += SEGMENT_POINTS

        if (segment === "") {
          score += ROOT_POINTS
        } else if (PARAM.test(segment)) {
          score += DYNAMIC_POINTS
        } else if (segment[0] === "*") {
          score -= SEGMENT_POINTS + SPLAT_PENALTY
        } else {
          score += STATIC_POINTS
        }

        return score
      }, 0)

  return {route, score, index}
}

const pickRoute = (routes, uri) => {
  let match
  let default_

  const [uriPathname] = uri.split("?")
  const uriSegments = segmentize(uriPathname)
  const isRootUri = uriSegments[0] === ""
  const ranked = routes
    .map(rankRoute)
    .sort((a, b) => (a.score < b.score ? 1 : a.score > b.score ? -1 : a.index - b.index))

  for (let i = 0, l = ranked.length; i < l; i++) {
    const route = ranked[i].route
    let missed = false

    if (route.default) {
      default_ = {
        route,
        params: {},
        uri,
      }
      continue
    }

    const routeSegments = segmentize(route.path)
    const params = {}
    const max = Math.max(uriSegments.length, routeSegments.length)
    let index = 0

    for (; index < max; index++) {
      const routeSegment = routeSegments[index]
      const uriSegment = uriSegments[index]

      if (routeSegment && routeSegment[0] === "*") {
        // Hit a splat, just grab the rest, and return a match
        // uri:   /files/documents/work
        // route: /files/* or /files/*splatname
        const splatName = routeSegment === "*" ? "*" : routeSegment.slice(1)

        params[splatName] = uriSegments.slice(index).map(decodeURIComponent).join("/")
        break
      }

      if (typeof uriSegment === "undefined") {
        // URI is shorter than the route, no match
        // uri:   /users
        // route: /users/:userId
        missed = true
        break
      }

      const dynamicMatch = PARAM.exec(routeSegment)

      if (dynamicMatch && !isRootUri) {
        const value = decodeURIComponent(uriSegment)
        params[dynamicMatch[1]] = value
      } else if (routeSegment !== uriSegment) {
        // Current segments don't match, not dynamic, not splat, so no match
        // uri:   /users/123/settings
        // route: /users/:id/profile
        missed = true
        break
      }
    }

    if (!missed) {
      match = {
        route,
        params,
        uri: "/" + uriSegments.slice(0, index).join("/"),
      }
      break
    }
  }

  return match || default_ || null
}

export type Serializer = {
  encode: (v: any) => string
  decode: (v: string) => any
}

export type ComponentSerializers = Record<string, Serializer>

export type RegisterOpts = {
  required?: string[]
  serializers?: ComponentSerializers
  requireUser?: boolean
  requireSigner?: boolean
}

export type Route = RegisterOpts & {
  path: string
  component: any
}

export type HistoryItem = {
  path: string
  key?: string
  mini?: boolean
  modal?: boolean
  virtual?: boolean
  noEscape?: boolean
  replace?: boolean
  context?: Record<string, any>
}

export const asPath = (...parts: string[]) => {
  let path = parts.filter(identity).join("/")

  if (path && !path.startsWith("/")) {
    path = "/" + path
  }

  return path
}

type RouterExtensionParams = {
  path: string
  queryParams?: Record<string, any>
  context?: Record<string, any>
  config?: Record<string, any>
}

class RouterExtension {
  constructor(
    readonly router,
    readonly params: RouterExtensionParams,
    readonly getId: (...args: any[]) => string = identity,
  ) {}

  get path() {
    return this.params.path
  }

  get queryParams() {
    return this.params.queryParams
  }

  get context() {
    return this.params.context
  }

  get config() {
    return this.params.config
  }

  of = (...args) => this.at(this.getId(...args))

  clone = params => new RouterExtension(this.router, {...this.params, ...params})

  at = path => this.clone({path: asPath(this.path, path)})

  qp = queryParams => {
    const match = pickRoute(this.router.routes, this.path)

    const data = {...this.queryParams}

    for (const [k, v] of Object.entries(queryParams)) {
      const serializer = match.route.serializers?.[k]

      if (serializer && v) {
        data[k] = serializer.encode(v)
      }
    }

    return this.clone({queryParams: data})
  }

  cx = context => this.clone(updateIn("context", mergeLeft(context))(this.params))

  cg = config => this.clone(updateIn("config", mergeLeft(config))(this.params))

  toString = () => {
    let path = this.path

    if (this.queryParams) {
      const qs = buildQueryString(this.queryParams)

      if (qs.length > 1) {
        path += qs
      }
    }

    return path
  }

  go = (newConfig = {}) =>
    this.router.go(
      filterVals(identity, {
        ...this.config,
        ...newConfig,
        context: this.context,
        path: this.toString(),
      }),
    )

  push = (config = {}) => this.go(config)

  open = (config = {}) => this.go({...config, modal: true})

  replace = (config = {}) => this.go({...config, replace: true})

  replaceModal = (config = {}) => this.go({...config, replace: true, modal: true})
}

export class Router {
  routes: Route[] = []
  extensions: Record<string, RouterExtension> = {}
  history = writable<HistoryItem[]>([])
  nonVirtual = this.history.derived(reject((h: HistoryItem) => h.virtual))
  pages = this.nonVirtual.derived(filter((h: HistoryItem) => !h.modal))
  page = this.nonVirtual.derived(find((h: HistoryItem) => !h.modal))
  modals = this.nonVirtual.derived(takeWhile((h: HistoryItem) => h.modal))
  modal = this.nonVirtual.derived(find((h: HistoryItem) => h.modal))
  current = this.nonVirtual.derived(history => history[0])

  init() {
    this.at(window.location.pathname + window.location.search).push()
    this.page.subscribe($page => {
      if (!$page) {
        logger.error("No page available")
      }
    })
  }

  listen() {
    return globalHistory.listen(({location, action}) => {
      const {state, pathname, search} = location
      const path = pathname + search
      const [cur, prev] = this.history.get()
      const key = this.getKey({path: pathname, ...state})

      if (action === "POP") {
        if (prev && path === prev.path && key !== this.getKey(cur)) {
          this.history.update($history => $history.slice(1))
        } else if (path !== cur.path) {
          this.go({path})
        }
      }
    })
  }

  register = (
    path: string,
    component: any,
    {serializers, requireUser, requireSigner, required}: RegisterOpts = {},
  ) => {
    this.routes.push({path, component, required, serializers, requireUser, requireSigner})
  }

  getMatch(path): {route: Route; params: Record<string, any>} {
    const match = pickRoute(this.routes, path)

    if (!match) {
      throw new Error(`Failed to match ${path}`)
    }

    return match
  }

  go({replace, ...state}: HistoryItem) {
    if (!state.path) {
      throw new Error("router.go called without a path")
    }

    if (!state.key) {
      state.key = randomId()
    }

    this.history.update($history => {
      // Drop one if we're replacing
      if (replace) {
        $history = $history.slice(1)
      }

      // Keep our history at 100 entries
      return [state, ...$history.slice(0, 100)]
    })

    globalHistory.navigate(state.path, {replace, state: {key: state.key}})
  }

  pop() {
    const $history = this.history.get()

    if ($history.length === 1) {
      return
    }

    window.history.back()
  }

  remove(key) {
    this.history.update(reject(($item: HistoryItem) => $item.key === key))
  }

  clearModals() {
    this.history.update($history => {
      while ($history[0]?.modal) {
        $history.splice(0, 1)
      }

      // Make sure we don't completely clear history out
      if ($history.length === 0) {
        $history.push({path: "/"})
      }

      globalHistory.navigate($history[0].path || "/")

      return $history
    })
  }

  // Extensions

  extend(path: string, getId) {
    this.extensions[path] = new RouterExtension(this, {path: asPath(path)}, getId)
  }

  at(path) {
    return this.extensions[path] || new RouterExtension(this, {path: asPath(path)})
  }

  from(historyItem) {
    const path = first(historyItem.path.split("?"))
    const params = this.decodeQueryString(historyItem.path)

    return this.at(path).qp(params).cg(historyItem)
  }

  fromCurrent() {
    return this.from(this.current.get())
  }

  virtual() {
    return this.fromCurrent().cg({virtual: true})
  }

  // Props etc

  decodeQueryString = (path: string) => {
    const {route} = this.getMatch(path)
    const queryParams = parseQueryString(path)

    const data = {}

    for (const [k, serializer] of Object.entries(route.serializers || {})) {
      const v = queryParams[k]

      if (v) {
        try {
          Object.assign(data, serializer.decode(v))
        } catch (e) {
          logger.warn("Query string decoding failed", k, v, e)
        }
      }
    }

    return data
  }

  decodeRouteParams = (path: string) => {
    const {route, params} = this.getMatch(path)
    const data = {...params}

    for (const [k, serializer] of Object.entries(route.serializers || {})) {
      const v = params[k]

      if (v) {
        try {
          Object.assign(data, serializer.decode(v))
        } catch (e) {
          logger.warn("Route param decoding failed", k, v, e)
        }
      }
    }

    return data
  }

  getKey = (item: HistoryItem) => item.key || item.path

  getProps = (item: HistoryItem) => ({
    ...this.decodeQueryString(item.path),
    ...this.decodeRouteParams(item.path),
    ...item.context,
  })
}
