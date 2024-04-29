<script lang="ts">
  import cx from "classnames"
  import SelectList from 'src/partials/SelectList.svelte'

  export let displayOption = x => x

  const getClassName = (i, active) =>
    cx("px-4 py-2 transition-all", {
      "border-l border-solid border-neutral-100": i > 0,
      "bg-accent text-white": active,
    })
</script>

<div class="inline-block">
  <SelectList {...$$props} class="inline-flex overflow-hidden rounded-full border border-solid border-neutral-100">
    <div slot="item" let:i let:active let:option class={getClassName(i, active)}>
      {displayOption(option)}
    </div>
  </SelectList>
</div>
