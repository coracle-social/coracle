import type {NetContext} from "@welshman/net"
import type {AppContext} from "@welshman/app"
import type {SwipeCustomEvent} from "src/util/swipe"

declare module "fuse.js/dist/fuse.min.js"

declare module "@welshman/lib" {
  interface Context {
    net: NetContext
    app: AppContext
  }
}

declare namespace svelteHTML {
  interface HTMLAttributes {
    "on:swipe"?: (event: SwipeCustomEvent) => any
  }
}
