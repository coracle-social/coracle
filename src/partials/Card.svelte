<script lang="ts">
  import cx from "classnames"
  import {createEventDispatcher} from "svelte"
  import AlternatingBackground from "src/partials/AlternatingBackground.svelte"

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

    const newClick = getClick(e)

    if (newClick && click) {
      const {x, y, t} = newClick
      const h = Math.sqrt(Math.pow(click.x - x, 2) + Math.pow(click.y - y, 2))

      if (t - click.t < 1000 && h < 20) {
        dispatch("click", e)
      }
    } else {
      dispatch("click", e)
    }
  }
</script>

<div on:mousedown={startClick} on:touchstart={startClick} on:click={onClick}>
  <AlternatingBackground border {interactive} class={cx($$props.class, "rounded p-3 text-lightest")}>
    <slot />
  </AlternatingBackground>
</div>
