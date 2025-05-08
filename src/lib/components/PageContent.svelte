<script lang="ts">
  import type {Snippet} from "svelte"

  interface Props {
    element?: Element
    children?: Snippet
    [key: string]: any
  }

  let {children, element = $bindable(), ...props}: Props = $props()
</script>

<div
  {...props}
  bind:this={element}
  data-component="PageContent"
  class="scroll-container cw md:bottom-sai fixed bottom-[calc(var(--saib)+3.5rem)] top-[calc(var(--sait)+3rem)] overflow-y-auto overflow-x-hidden {props.class}">
  {@render children?.()}
</div>
