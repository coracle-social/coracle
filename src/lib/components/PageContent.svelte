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
  class="scroll-container saib cw fixed top-12 h-[calc(100%-6.5rem)] overflow-y-auto overflow-x-hidden md:h-[calc(100%-3rem)] {props.class}">
  {@render children?.()}
</div>
