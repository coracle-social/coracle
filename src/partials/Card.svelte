<script lang="ts">
  import cx from "classnames"
  import {createEventDispatcher} from "svelte"
  import {fly} from "src/util/transition"

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
  in:fly={{y: 20}}
  on:mousedown={startClick}
  on:touchstart={startClick}
  on:click={onClick}
  class={cx(
    $$props.class,
    "card group rounded-2xl border border-solid border-gray-6 bg-gray-7 p-3 text-gray-2",
    "group-[.modal]:border group-[.modal]:border-solid group-[.modal]:border-gray-6 group-[.modal]:bg-gray-8",
    "group-[.card]:border group-[.card]:border-solid group-[.card]:border-gray-6 group-[.card]:bg-gray-8",
    {
      "cursor-pointer transition-all hover:bg-gray-8 group-[.card]:hover:bg-gray-7 group-[.modal]:hover:bg-gray-7":
        interactive,
    }
  )}>
  <slot />
</div>
