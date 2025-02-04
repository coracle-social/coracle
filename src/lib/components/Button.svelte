<script lang="ts">
  interface Props {
    type?: "button" | "submit"
  }

  let {type = "button", ...restProps} = $props()

  const className = $derived(`text-left ${restProps.class}`)
</script>

{#if type === "submit"}
  <button {...restProps} {type} class={className}>
    <slot />
  </button>
{:else}
  <button on:click|stopPropagation|preventDefault {...restProps} {type} class={className}>
    <slot />
  </button>
{/if}
