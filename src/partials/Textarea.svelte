<script>
  import cx from "classnames"

  export let value
  export let element = null

  const className = cx(
    $$props.class,
    "rounded bg-light shadow-inset py-2 px-4 pr-10 text-black w-full text-dark",
    "placeholder:text-dark placeholder:opacity-75",
  )
</script>

<svelte:options accessors />

<textarea {...$$props} class={className} bind:this={element} bind:value on:keydown on:keypress />
