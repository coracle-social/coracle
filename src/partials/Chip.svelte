<script lang="ts">
  import cx from "classnames"

  export let theme

  const className = cx($$props.class, "inline-block rounded-full border border-solid py-1 px-2", {
    "border-gray-1": theme === "dark",
    "border-gray-8": theme === "light",
  })
</script>

<div class={className}>
  <div class="flex items-center gap-2">
    <i class="fa fa-times cursor-pointer" on:click|preventDefault />
    <slot />
  </div>
</div>
