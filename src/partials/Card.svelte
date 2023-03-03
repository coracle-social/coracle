<script>
  import cx from 'classnames'
  import {fly} from 'svelte/transition'

  export let interactive = false
  export let invertColors = false
</script>

<div
  on:click
  in:fly={{y: 20}}
  class={cx($$props.class, "card p-3 text-white rounded-2xl bg-dark", {
    'bg-dark border border-solid border-medium': !invertColors,
    'bg-medium border border-solid border-shimmer': invertColors,
    "cursor-pointer transition-all": interactive,
    "hover:bg-medium": interactive && !invertColors,
  })}>
  <slot />
</div>
