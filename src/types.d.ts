import type {NetContext} from "@welshman/net"
import type {AppContext} from "@welshman/app"

declare module "fuse.js/dist/fuse.min.js"

declare module "@welshman/lib" {
  interface Context {
    net: NetContext
    app: AppContext
  }
}
