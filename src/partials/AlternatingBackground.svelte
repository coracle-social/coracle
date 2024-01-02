<script lang="ts">
  import cx from 'classnames'
  import {onMount} from 'svelte'

  export let interactive = false

  let element

  onMount(() => {
    let cur = element
    let count = 0
    while (cur.parentElement) {
      if (cur.parentElement.classList.contains("bg-swap")) {
        count++
      }

      cur = cur.parentElement
    }

    const isAlt = count % 2 === 1

    if (isAlt) {
      element.classList.remove("bg-cocoa")
      element.classList.remove("hover:bg-cocoa-d")
    } else {
      element.classList.remove("bg-dark")
      element.classList.remove("hover:bg-dark-d")
    }

    if (!interactive) {
      element.classList.remove("hover:bg-dark-d")
      element.classList.remove("hover:bg-cocoa-d")
    }
  })
</script>

<div
  {...$$props}
  class={cx($$props.class, "bg-swap bg-dark bg-cocoa hover:bg-dark-d hover:bg-cocoa-d", {"cursor-pointer transition-colors": interactive})}
  bind:this={element}>
  <slot />
</div>
