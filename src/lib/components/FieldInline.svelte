<script lang="ts">
  interface Props {
    label?: import("svelte").Snippet
    input?: import("svelte").Snippet
    info?: import("svelte").Snippet
    [key: string]: any
  }

  const {...props}: Props = $props()
</script>

<div class="grid grid-cols-1 gap-2 md:grid-cols-3 {props.class}">
  <label class="flex items-center gap-2 font-bold">
    {@render props.label?.()}
  </label>
  <div class="col-span-2 flex items-center gap-2">
    {@render props.input?.()}
  </div>
  <p class="flex-end text-sm md:col-span-3">
    {#if props.info}
      {@render props.info?.()}
    {/if}
  </p>
</div>
