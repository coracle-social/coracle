<script lang="ts">
  import type {Snippet} from "svelte"

  interface Props {
    label?: Snippet
    input?: Snippet
    info?: Snippet
    [key: string]: any
  }

  const {label, input, info, ...props}: Props = $props()
</script>

<div class="flex flex-col gap-2 {props.class}">
  {#if label}
    <label class="flex items-center gap-2 font-bold">
      {@render label()}
    </label>
  {/if}
  {@render input?.()}
  {#if info}
    <p class="text-sm">
      {@render info()}
    </p>
  {/if}
</div>
