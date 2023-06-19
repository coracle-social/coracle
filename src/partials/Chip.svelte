<script lang="ts">
  import cx from "classnames"

  export let theme = "dark"
  export let onClick = null

  const className = cx($$props.class, "inline-block rounded-full border border-solid py-1 px-2", {
    "border-gray-1": theme === "dark",
    "border-gray-8": theme === "light",
  })
</script>

<div class={className} on:click>
  <div class="flex items-center gap-2 whitespace-nowrap">
    {#if onClick}
      <i class="fa fa-times cursor-pointer" on:click|preventDefault={onClick} />
    {/if}
    <slot />
  </div>
</div>
