<script lang="ts">
  import cx from "classnames"
  import {onMount} from "svelte"

  export let background = false

  let element, isAlt

  onMount(() => {
    let cur = element
    let count = 0
    while (cur.parentElement) {
      if (cur.parentElement.classList.contains("bg-swap")) {
        count++
      }

      cur = cur.parentElement
    }

    isAlt = count % 2 === 0
  })
</script>

<div
  on:click
  bind:this={element}
  class={cx("bg-swap", $$props.class)}
  class:bg-tinted-700={background && isAlt}
  class:bg-neutral-800={background && !isAlt}>
  <slot {isAlt} />
</div>
