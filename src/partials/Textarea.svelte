<svelte:options accessors />

<script lang="ts">
  import cx from "classnames"

  export let value
  export let element = null

  const className = cx(
    $$props.class,
    "rounded shadow-inset py-2 px-4 pr-10 w-full bg-white text-black",
    "placeholder:text-neutral-600",
  )
</script>

<textarea {...$$props} class={className} bind:this={element} bind:value on:keydown on:keypress />
