<script lang="ts">
  interface Props {
    children?: import("svelte").Snippet
    [key: string]: any
  }

  let {...props}: Props = $props()
</script>

<div
  class="sait saib sair scroll-container max-h-screen flex-grow overflow-auto bg-base-200 pb-14 md:pb-0 {props.class}">
  {@render props.children?.()}
</div>
