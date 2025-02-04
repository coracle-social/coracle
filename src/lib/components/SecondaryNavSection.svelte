<script lang="ts">
  interface Props {
    children?: import("svelte").Snippet
    [key: string]: any
  }

  let {...props}: Props = $props()
</script>

<div class="flex flex-col gap-1 px-2 py-4 {props.class}">
  {@render props.children?.()}
</div>
