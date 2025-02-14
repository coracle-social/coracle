import {sleep} from "@welshman/lib"
export {preventDefault, stopPropagation} from "svelte/legacy"

export const copyToClipboard = (text: string) => {
  const {activeElement} = document
  const input = document.createElement("textarea")

  input.innerHTML = text
  document.body.appendChild(input)
  input.select()

  const result = document.execCommand("copy")

  document.body.removeChild(input)
  ;(activeElement as HTMLElement).focus()

  return result
}

export type ScrollerOpts = {
  onScroll: () => any
  element: Element
  threshold?: number
  reverse?: boolean
  delay?: number
}

export type Scroller = {
  check: () => Promise<void>
  stop: () => void
}

export const createScroller = ({
  onScroll,
  element,
  delay = 1000,
  threshold = 2000,
  reverse = false,
}: ScrollerOpts) => {
  let done = false

  const container = element.classList.contains("scroll-container")
    ? element
    : element.closest(".scroll-container")

  const check = async () => {
    if (container) {
      // While we have empty space, fill it
      const {scrollY, innerHeight} = window
      const {scrollHeight, scrollTop} = container
      const offset = Math.abs(scrollTop || scrollY)
      const shouldLoad = offset + innerHeight + threshold > scrollHeight

      // Only trigger loading the first time we reach the threshold
      if (shouldLoad) {
        await onScroll()
      }
    }

    // No need to check all that often
    await sleep(delay)

    if (!done) {
      requestAnimationFrame(check)
    }
  }

  requestAnimationFrame(check)

  return {
    check,
    stop: () => {
      done = true
    },
  }
}

export const isMobile = "ontouchstart" in document.documentElement

export const downloadText = (filename: string, text: string) => {
  const blob = new Blob([text], {type: "text/plain"})
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")

  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
