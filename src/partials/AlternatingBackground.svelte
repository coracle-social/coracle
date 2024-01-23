<script lang="ts">
  import cx from "classnames"
  import {onMount} from "svelte"

  export let interactive = false
  export let border = false

  let element, className

  onMount(() => {
    let cur = element
    let count = 0
    while (cur.parentElement) {
      if (cur.parentElement.classList.contains("bg-swap")) {
        count++
      }

      cur = cur.parentElement
    }

    const isAlt = count % 2 === 0

    className = cx({
      "border-r-4 border-transparent": border,
      "cursor-pointer transition-colors": interactive,
      "hover:border-cocoa": border && interactive && isAlt,
      "hover:border-dark-l": border && interactive && !isAlt,
      "bg-cocoa": isAlt,
      "hover:bg-cocoa-d": isAlt && interactive,
      "bg-dark": !isAlt,
      "hover:bg-dark-d": !isAlt && interactive,
    })
  })
</script>

<div {...$$props} class={cx($$props.class, "bg-swap", className)} bind:this={element}>
  <slot />
</div>
