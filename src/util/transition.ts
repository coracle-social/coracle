import {cubicOut} from "svelte/easing"
import * as t from "svelte/transition"

// Fly animation kills safari for some reason, use a modified fade instead
// @ts-ignore
export const fly = window.safari
  ? (node, params) => t.fade(node, {duration: 100, ...params})
  : t.fly
export const fade = t.fade
export const slide = t.slide

// Copy-pasted and tweaked from slide source code
export function slideAndFade(
  node: any,
  {delay = 0, duration = 400, easing = cubicOut, axis = "y"} = {},
) {
  const style = getComputedStyle(node)
  const primary_property = axis === "y" ? "height" : "width"
  const primary_property_value = parseFloat(style[primary_property])
  const secondary_properties = axis === "y" ? ["top", "bottom"] : ["left", "right"]
  const capitalized_secondary_properties = secondary_properties.map(
    (e: string) => `${e[0].toUpperCase()}${e.slice(1)}`,
  )
  const padding_start_value = parseFloat(style[`padding${capitalized_secondary_properties[0]}`])
  const padding_end_value = parseFloat(style[`padding${capitalized_secondary_properties[1]}`])
  const margin_start_value = parseFloat(style[`margin${capitalized_secondary_properties[0]}`])
  const margin_end_value = parseFloat(style[`margin${capitalized_secondary_properties[1]}`])
  const border_width_start_value = parseFloat(
    style[`border${capitalized_secondary_properties[0]}Width`],
  )
  const border_width_end_value = parseFloat(
    style[`border${capitalized_secondary_properties[1]}Width`],
  )
  return {
    delay,
    duration,
    easing,
    css: (t: number) =>
      "overflow: hidden;" +
      `opacity: ${t};` +
      `${primary_property}: ${t * primary_property_value}px;` +
      `padding-${secondary_properties[0]}: ${t * padding_start_value}px;` +
      `padding-${secondary_properties[1]}: ${t * padding_end_value}px;` +
      `margin-${secondary_properties[0]}: ${t * margin_start_value}px;` +
      `margin-${secondary_properties[1]}: ${t * margin_end_value}px;` +
      `border-${secondary_properties[0]}-width: ${t * border_width_start_value}px;` +
      `border-${secondary_properties[1]}-width: ${t * border_width_end_value}px;`,
  }
}
