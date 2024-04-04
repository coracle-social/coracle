<script lang="ts">
  import cx from "classnames"

  export let pad = false
  export let dark = true
  export let light = false
  export let danger = false
  export let warning = false
  export let small = false
  export let onRemove = null

  $: className = cx($$props.class, "inline-block rounded-full border border-solid cy-chip", {
    "border-neutral-800": light,
    "border-neutral-100": dark,
    "!border-danger": danger,
    "!border-warning": warning,
    "py-1 px-2": !small,
    "py-0.5 px-2 text-sm": small,
    "mb-1 mr-1": pad,
  })
</script>

<div class={className} on:click>
  <div class="flex items-center gap-2 whitespace-nowrap">
    {#if onRemove}
      <i class="fa fa-times cursor-pointer" on:click|preventDefault={onRemove} />
    {/if}
    <slot />
  </div>
</div>
