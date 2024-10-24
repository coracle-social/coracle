<script lang="ts">
  export let type: "button" | "submit" = "button"

  $: className = `text-left ${$$props.class}`
</script>

{#if type === 'submit'}
  <button {...$$props} {type} class={className}>
    <slot />
  </button>
{:else}
  <button on:click|stopPropagation|preventDefault {...$$props} {type} class={className}>
    <slot />
  </button>
{/if}
