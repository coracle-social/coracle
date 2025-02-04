<script lang="ts">
  const {children, onLongPress, ...restProps} = $props()

  const ontouchstart = (event: any) => {
    touch = event.touches[0]
    timeout = setTimeout(onLongPress, 500)
  }

  const ontouchmove = (event: any) => {
    const curTouch = event.touches[0]

    if (Math.abs(curTouch.clientX - touch.clientX) > 30) {
      clearTimeout(timeout)
    }

    if (Math.abs(curTouch.clientY - touch.clientY) > 30) {
      clearTimeout(timeout)
    }
  }

  const ontouchend = () => clearTimeout(timeout)

  let touch: Touch
  let timeout: any
</script>

<div role="button" tabindex="0" {ontouchstart} {ontouchmove} {ontouchend} {...restProps}>
  {@render children()}
</div>
