<script lang="ts">
  import {createEventDispatcher} from "svelte"

  export let loading = false
  export let disabled = false
  export let stopPropagation = false
  export let type: "button" | "submit" = "button"

  const dispatch = createEventDispatcher()

  const onClick = (e: Event) => {
    if (stopPropagation) {
      e.stopPropagation()
    }

    dispatch("click", e)
  }
</script>

<button
  {...$$restProps}
  {type}
  class="cursor-pointer {disabled || loading ? 'btn-disabled' : ''} {$$props.class}"
  on:click={onClick}>
  {#if loading}
    <i class="fa fa-circle-notch fa-spin fa-sm" />
  {/if}
  <slot />
</button>
