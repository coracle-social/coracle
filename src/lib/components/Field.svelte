<script lang="ts">
  interface Props {
    label?: import("svelte").Snippet
    input?: import("svelte").Snippet
    info?: import("svelte").Snippet
    [key: string]: any
  }

  const {...props}: Props = $props()
</script>

<div class="flex flex-col gap-2 {props.class}">
  {#if props.label}
    <label class="flex items-center gap-2 font-bold">
      {@render props.label?.()}
    </label>
  {/if}
  {@render props.input?.()}
  {#if props.info}
    <p class="text-sm">
      {@render props.info?.()}
    </p>
  {/if}
</div>
