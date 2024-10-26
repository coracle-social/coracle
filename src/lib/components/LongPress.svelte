<script lang="ts">
  export let onLongPress

  const onTouchStart = (event: any) => {
    touch = event.touches[0]
    timeout = setTimeout(onLongPress, 500)
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
  let timeout: number
</script>

<div role="button" tabindex="0" on:click on:touchstart={onTouchStart} on:touchmove={onTouchMove} on:touchend={onTouchEnd} {...$$props}>
  <slot />
</div>
