import type {FlyParams} from "svelte/transition"
import {fly as baseFly} from "svelte/transition"

export const fly = (node: Element, params?: FlyParams | undefined) =>
  baseFly(node, {y: 20, ...params})
