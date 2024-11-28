export type SwipeCustomEvent = {
  isTop: boolean
  deltaX: number
  deltaY: number
  startX: number
  startY: number
  currentX: number
  currentY: number
}

export function swipe(
  node: HTMLElement,
  options: {
    thresholdX?: number
    thresholdY?: number
    direction?: "left" | "right" | "top" | "bottom"
  } = {
    direction: "top",
  },
) {
  const {direction} = options
  let startX: number | null
  let startY: number | null

  function handleTouchStart(event: TouchEvent) {
    const touch = event.touches[0]
    startX = touch.clientX
    startY = touch.clientY
  }

  function handleTouchMove(event: TouchEvent) {
    if (!startX || !startY) return

    const touch = event.touches[0]
    const deltaX = touch.clientX - startX
    const deltaY = touch.clientY - startY

    const lateral = deltaX > 0 ? "right" : "left"
    const vertical = deltaY > 0 ? "top" : "bottom"

    const swipeX = lateral == direction
    const swipeY = vertical == direction

    if (!swipeX && !swipeY) return

    // for an horizontla swipe, make sure deltaX is 2x deltaY
    if (swipeX && Math.abs(deltaX) < Math.abs(2 * deltaY)) return

    // for an vertical swipe, make sure deltaY is 2x deltaX
    if (swipeY && Math.abs(deltaY) < Math.abs(2 * deltaX)) return

    node.dispatchEvent(
      new CustomEvent("swipe", {
        detail: {
          isTop: node.scrollTop == 0,
          startX,
          startY,
          deltaX,
          deltaY,
          currentX: touch.clientX,
          currentY: touch.clientY,
        },
      }),
    )
  }

  function handleTouchEnd(event: TouchEvent) {
    if (!startX || !startY) return

    const touch = event.changedTouches[0]
    const deltaX = touch.clientX - startX
    const deltaY = touch.clientY - startY

    const lateral = deltaX > 0 ? "right" : "left"
    const vertical = deltaY > 0 ? "top" : "bottom"

    const swipeX = lateral == direction
    const swipeY = vertical == direction

    if (swipeX && swipeY) return

    // for an horizontla swipe, make sure deltaX is 2x deltaY
    if (swipeX && Math.abs(deltaX) < Math.abs(2 * deltaY)) return

    // for an vertical swipe, make sure deltaY is 2x deltaX
    if (swipeY && Math.abs(deltaY) < Math.abs(2 * deltaX)) return

    node.dispatchEvent(
      new CustomEvent("end", {
        detail: {
          isTop: node.scrollTop == 0,
          startX,
          startY,
          deltaX,
          deltaY,
          currentX: touch.clientX,
          currentY: touch.clientY,
        },
      }),
    )

    startX = null
    startY = null
  }

  node.addEventListener("touchstart", handleTouchStart)
  node.addEventListener("touchmove", handleTouchMove)
  node.addEventListener("touchend", handleTouchEnd)

  return {
    destroy() {
      node.removeEventListener("touchstart", handleTouchStart)
      node.removeEventListener("touchmove", handleTouchMove)
      node.removeEventListener("touchend", handleTouchEnd)
    },
  }
}
