import * as t from "svelte/transition"

// Fly animation kills safari for some reason, use a modified fade instead
// @ts-ignore
export const fly = window.safari
  ? (node, params) => t.fade(node, {duration: 100, ...params})
  : t.fly
export const fade = t.fade
export const slide = t.slide
