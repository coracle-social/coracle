<script lang="ts">
  import type {Snippet} from "svelte"

  interface Props {
    label?: Snippet
    secondary?: Snippet
    input?: Snippet
    info?: Snippet
    [key: string]: any
  }

  const {label, secondary, input, info, ...props}: Props = $props()
</script>

<div class="flex flex-col gap-2 {props.class}">
  <div class="flex items-center justify-between">
    {#if label}
      <label class="flex items-center gap-2 font-bold">
        {@render label()}
      </label>
    {/if}
    {#if secondary}
      <label class="flex items-center gap-2">
        {@render secondary()}
      </label>
    {/if}
  </div>
  {@render input?.()}
  {#if info}
    <p class="text-sm">
      {@render info()}
    </p>
  {/if}
</div>
