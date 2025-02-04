<script lang="ts">
  interface Props {
    children?: import("svelte").Snippet
    [key: string]: any
  }

  const {...props}: Props = $props()
</script>

<div
  class="sait saib sair scroll-container mb-14 max-h-screen flex-grow overflow-auto bg-base-200 md:mb-0 {props.class}">
  {@render props.children?.()}
</div>
