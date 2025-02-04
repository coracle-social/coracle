<script lang="ts">
  interface Props {
    icon?: import("svelte").Snippet
    title?: import("svelte").Snippet
    action?: import("svelte").Snippet
    [key: string]: any
  }

  const {...props}: Props = $props()
</script>

<div class="relative z-feature mx-2 rounded-xl pt-4 {props.class}">
  <div
    class="flex min-h-12 items-center justify-between gap-4 rounded-xl bg-base-100 px-4 shadow-xl">
    <div class="flex items-center gap-4">
      {@render props.icon?.()}
      {@render props.title?.()}
    </div>
    {@render props.action?.()}
  </div>
</div>
