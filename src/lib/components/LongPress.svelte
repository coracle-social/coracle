<script lang="ts">
  import {createBubbler} from "svelte/legacy"

  const bubble = createBubbler()
  const {...props} = $props()

  const onTouchStart = (event: any) => {
    touch = event.touches[0]
    timeout = setTimeout(props.onLongPress, 500)
  }

  const onTouchMove = (event: any) => {
    const curTouch = event.touches[0]

    if (Math.abs(curTouch.clientX - touch.clientX) > 30) {
      clearTimeout(timeout)
    }

    if (Math.abs(curTouch.clientY - touch.clientY) > 30) {
      clearTimeout(timeout)
    }
  }

  const onTouchEnd = () => clearTimeout(timeout)

  let touch: Touch
  let timeout: any
</script>

<div
  role="button"
  tabindex="0"
  onclick={bubble("click")}
  ontouchstart={onTouchStart}
  ontouchmove={onTouchMove}
  ontouchend={onTouchEnd}
  {...props}>
  {@render props.children?.()}
</div>
