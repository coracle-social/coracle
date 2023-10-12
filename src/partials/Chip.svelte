<script lang="ts">
  import cx from "classnames"

  export let theme = "dark"
  export let onRemove = null

  const className = cx(
    $$props.class,
    "inline-block rounded-full border border-solid py-1 px-2 cy-chip",
    {
      "border-gray-1": theme === "dark",
      "border-gray-8": theme === "light",
    }
  )
</script>

<div class={className}>
  <div class="flex items-center gap-2 whitespace-nowrap">
    {#if onRemove}
      <i class="fa fa-times cursor-pointer" on:click|preventDefault={onRemove} />
    {/if}
    <slot />
  </div>
</div>
