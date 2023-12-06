<script lang="ts">
  import cx from "classnames"
  import {createEventDispatcher} from "svelte"

  export let interactive = false
  export let stopPropagation = false

  let click

  const dispatch = createEventDispatcher()

  const getClick = e => ({
    x: e.x || e.touches[0].clientX,
    y: e.y || e.touches[0].clientY,
    t: Date.now(),
  })

  const startClick = e => {
    click = getClick(e)
  }

  const onClick = e => {
    if (stopPropagation) {
      e.stopPropagation()
    }

    const {x, y, t} = getClick(e)
    const h = Math.sqrt(Math.pow(click.x - x, 2) + Math.pow(click.y - y, 2))

    if (t - click.t < 1000 && h < 20) {
      dispatch("click", e)
    }
  }
</script>

<div
  on:mousedown={startClick}
  on:touchstart={startClick}
  on:click={onClick}
  class={cx(
    $$props.class,
    "card group rounded-2xl border border-solid border-mid bg-cocoa p-3 text-lightest",
    "group-[.modal]:border group-[.modal]:border-solid group-[.modal]:border-mid group-[.modal]:bg-dark",
    "group-[.card]:border group-[.card]:border-solid group-[.card]:border-mid group-[.card]:bg-dark",
    {
      "cursor-pointer transition-all hover:bg-dark group-[.card]:hover:bg-cocoa group-[.modal]:hover:bg-cocoa":
        interactive,
    }
  )}>
  <slot />
</div>
