// @ts-nocheck
import {cubicOut} from "svelte/easing"
import type {FlyParams} from "svelte/transition"
import {fly as baseFly} from "svelte/transition"

export {fade, slide} from "svelte/transition"

export const fly = (node: Element, params?: FlyParams | undefined) =>
  baseFly(node, {y: 20, ...params})

export type TranslateParams = {
  delay?: number
  duration?: number
  easing?: (t: number) => number
  axis?: "x" | "y"
  reverse?: boolean
}

export const translate = (
  node: Element,
  {delay = 0, duration = 400, easing = cubicOut, axis = "y", reverse = false}: TranslateParams = {},
) => {
  return {
    delay,
    duration,
    easing,
    css: (t: number) => {
      const p = reverse ? `${t * 100}%` : `${100 - t * 100}%`

      if (axis === "x") {
        return `transform: translateX(${p})`
      } else {
        return `transform: translateY(${p})`
      }
    },
  }
}

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

export const conditionalTransition =
  (condition: any, transition: any) => (node: any, args?: any) =>
    condition ? transtion(node, args) : null
