<script lang="ts">
  import cx from "classnames"
  import Tile from 'src/partials/Tile.svelte'
  import SelectList from 'src/partials/SelectList.svelte'

  const getClass = active =>
    cx('transition-all', {
      'bg-tinted-600 text-tinted-800': !active,
      'bg-tinted-200 text-neutral-900': active,
    })
</script>

<SelectList {...$$props} class="grid grid-cols-{$$props.options.length} justify-between gap-4">
  <div slot="item" let:i let:active let:option>
    <Tile class={getClass(active)}>
      <slot name="item" {option} {active} />
    </Tile>
  </div>
</SelectList>
