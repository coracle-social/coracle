<script>
  import cx from 'classnames'
  import {fly} from 'svelte/transition'

  export let interactive = false
  export let invertColors = false
</script>

<li
  on:click
  in:fly={{y: 20}}
  class={cx("py-2 px-3 flex flex-col gap-2 text-white", {
    "cursor-pointer transition-all": interactive,
    "hover:bg-dark": interactive && !invertColors,
    "hover:bg-medium": interactive && invertColors,
  })}>
  <slot />
</li>
