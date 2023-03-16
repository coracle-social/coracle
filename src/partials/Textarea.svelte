<svelte:options accessors />

<script>
  import cx from "classnames"

  export let value
  export let element = null

  const className = cx(
    $$props.class,
    "rounded shadow-inset py-2 px-4 pr-10 w-full bg-gray-3 text-gray-8",
    "placeholder:text-gray-7 placeholder:opacity-75"
  )
</script>

<textarea {...$$props} class={className} bind:this={element} bind:value on:keydown on:keypress />
