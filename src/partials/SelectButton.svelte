<script lang="ts">
  import cx from "classnames"
  import SelectList from 'src/partials/SelectList.svelte'

  export let displayOption = x => x

  const getClassName = active =>
    cx("px-4 h-7 transition-all rounded-full mr-2 mb-2 inline-flex items-center", {
      "bg-tinted-100 text-accent": active,
      "bg-neutral-900 text-neutral-400": !active,
    })
</script>

<div class="inline-block -mb-2">
  <SelectList {...$$props} class="inline-flex staatliches">
    <div slot="item" let:i let:active let:option class={getClassName(active)}>
      {displayOption(option)}
    </div>
  </SelectList>
</div>
