<script lang="ts">
  export let onLongPress

  const onTouchStart = () => {
    timeout = setTimeout(onLongPress, 500)
  }

  const onTouchEnd = () => clearTimeout(timeout)

  let timeout: number
</script>

<div role="button" tabindex="0" on:click on:touchstart={onTouchStart} on:touchend={onTouchEnd} {...$$props}>
  <slot />
</div>
