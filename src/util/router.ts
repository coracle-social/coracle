import {takeWhile, filter, identity, reject, path as getPath} from "ramda"
import {first, filterVals} from "hurdak"
import type {ComponentType, SvelteComponentTyped} from "svelte"
import {globalHistory} from "svelte-routing/src/history"
import {pick} from "svelte-routing/src/utils"
import {buildQueryString, parseQueryString} from "src/util/misc"
import {writable} from "src/engine"

export type Component = ComponentType<SvelteComponentTyped>

export type Serializer = {
  encode: (v: any) => string
  decode: (v: string) => any
}

export type ComponentSerializers = Record<string, Serializer>

export type Route = {
  path: string
  component: Component
  serializers?: ComponentSerializers
}

export type HistoryItem = {
  path: string
  params: Record<string, any>
  config: {
    id?: string
    mini?: boolean
    modal?: boolean
    virtual?: boolean
    noEscape?: boolean
    replace?: boolean
    context?: Record<string, any>
  }
  route: {
    path: string
    component: Component
    serializers?: ComponentSerializers
  }
}

export const asPath = (...parts: string[]) => {
  let path = parts.filter(identity).join("/")

  if (path && !path.startsWith("/")) {
    path = "/" + path
  }

  return path
}

export const decodeQueryString = ({path, route}: HistoryItem) => {
  const queryParams = parseQueryString(path)

  const data = {}

  for (const [k, serializer] of Object.entries(route.serializers || {})) {
    const v = queryParams[k]

    if (v) {
      Object.assign(data, serializer.decode(v))
    }
  }

  return data
}

export const decodeRouteParams = ({params, route}: HistoryItem) => {
  const data = {...params}

  for (const [k, serializer] of Object.entries(route.serializers || {})) {
    const v = params[k]

    if (v) {
      Object.assign(data, serializer.decode(v))
    }
  }

  return data
}

type RouterExtensionParams = {
  path: string
  queryParams?: Record<string, any>
  context?: Record<string, any>
}

class RouterExtension {
  constructor(
    readonly router,
    readonly params: RouterExtensionParams,
    readonly getId: (v: string) => string = identity
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

  of = value => this.at(this.getId(value))

  clone = params => new RouterExtension(this.router, {...this.params, ...params})

  at = path => this.clone({path: asPath(this.path, path)})

  qp = queryParams => {
    const match = pick(this.router.routes, this.path)

    for (const [k, v] of Object.entries(queryParams)) {
      const serializer = match.route.serializers?.[k]

      if (serializer) {
        queryParams[k] = serializer.encode(v)
      }
    }

    return this.clone({
      queryParams: filterVals(identity, {...this.queryParams, ...queryParams}),
    })
  }

  cx = context =>
    this.clone({
      context: filterVals(identity, {...this.context, ...context}),
    })

  toString = () => {
    let path = this.path

    if (this.queryParams) {
      path += buildQueryString(this.queryParams)
    }

    return path
  }

  go = (config = {}) => this.router.go(this.toString(), {...config, context: this.context})

  push = (config = {}) => this.go(config)

  open = (config = {}) => this.go({...config, modal: true})

  replace = (config = {}) => this.go({...config, replace: true})

  replaceModal = (config = {}) => this.go({...config, replace: true, modal: true})
}

export class Router {
  routes: Route[] = []
  extensions: Record<string, RouterExtension> = {}
  history = writable<HistoryItem[]>([])
  nonVirtual = this.history.derived(reject(getPath(["config", "virtual"])))
  pages = this.nonVirtual.derived(filter((h: HistoryItem) => !h.config.modal))
  page = this.pages.derived(first)
  modals = this.nonVirtual.derived(takeWhile((h: HistoryItem) => h.config.modal))
  modal = this.modals.derived(first)

  init() {
    this.at(window.location.pathname + window.location.search).push()
  }

  listen() {
    return globalHistory.listen(({location, action}) => {
      const {pathname, search} = location
      const [cur, prev] = this.nonVirtual.get()
      const path = search ? pathname + search : pathname

      // If we're going back, splice instead of push
      if (action === "POP" && path === prev?.path) {
        this.history.update($history => $history.slice(1))
      } else if (path !== cur.path) {
        this.go(path)
      }
    })
  }

  register = (path: string, component: Component, serializers?: ComponentSerializers) => {
    this.routes.push({path, component, serializers})
  }

  go(path, config: HistoryItem["config"] = {}) {
    const match = pick(this.routes, path)

    if (!match) {
      throw new Error(`Failed to match ${path}`)
    }

    const {route, params} = match

    this.history.update($history => {
      // Drop one if we're replacing
      if (config.replace) {
        $history.splice(0, 1)
      }

      // Keep our history at 100 entries
      return [{path, config, route, params}, ...$history.slice(0, 100)]
    })

    if (!config.virtual) {
      globalHistory.navigate(path, {replace: config.replace, state: null})
    }
  }

  pop() {
    const $history = this.history.get()

    if ($history.length === 1) {
      return
    }

    if ($history[0].config.virtual) {
      this.history.set($history.slice(1))
    } else {
      window.history.back()
    }
  }

  remove(id) {
    this.history.update(reject(($item: HistoryItem) => $item.config.id === id))
  }

  clearModals() {
    this.history.update($history => {
      while ($history[0].config?.modal) {
        $history.splice(0, 1)
      }

      globalHistory.navigate($history[0].path)

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
    return this.at(first(historyItem.path.split("?"))).qp(decodeQueryString(historyItem))
  }

  fromCurrent() {
    return this.from(first(this.nonVirtual.get()))
  }
}
