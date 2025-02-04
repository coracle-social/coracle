<script lang="ts">
  import {slide} from "@lib/transition"
  import Icon from "@lib/components/Icon.svelte"
  interface Props {
    title?: import("svelte").Snippet
    description?: import("svelte").Snippet
    children?: import("svelte").Snippet
    [key: string]: any
  }

  const {...props}: Props = $props()

  const toggle = () => {
    isOpen = !isOpen
  }

  let isOpen = $state(false)
</script>

<div class="relative flex flex-col gap-4 {props.class}">
  <button
    type="button"
    class="absolute right-8 top-8 h-4 w-4 cursor-pointer transition-all"
    class:rotate-90={!isOpen}
    onclick={toggle}>
    <Icon icon="alt-arrow-down" />
  </button>
  {@render props.title?.()}
  {@render props.description?.()}
  {#if isOpen}
    <div transition:slide>
      {@render props.children?.()}
    </div>
  {/if}
</div>
