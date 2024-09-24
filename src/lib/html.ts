import {sleep} from "@welshman/lib"

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

type ScrollerOpts = {
  threshold?: number
  reverse?: boolean
  delay?: number
}

export const createScroller = (
  loadMore: () => Promise<void>,
  {delay = 1000, threshold = 2000, reverse = false}: ScrollerOpts = {},
) => {
  let done = false
  const check = async () => {
    // While we have empty space, fill it
    const {scrollY, innerHeight} = window
    const {scrollHeight, scrollTop} = document.querySelector('.max-h-screen')!
    const offset = Math.abs(scrollTop || scrollY)
    const shouldLoad = offset + innerHeight + threshold > scrollHeight

    // Only trigger loading the first time we reach the threshold
    if (shouldLoad) {
      await loadMore()
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
