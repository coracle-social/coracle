import type {SwipeCustomEvent} from "src/util/swipe"

declare module "fuse.js/dist/fuse.min.js"

declare namespace svelteHTML {
  interface HTMLAttributes {
    "on:swipe"?: (event: SwipeCustomEvent) => any
  }
}
