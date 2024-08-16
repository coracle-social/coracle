<script context="module" lang="ts">
  import {emitter} from "@app/modal"

  const modalHeight = tweened(0, {
    duration: 700,
    easing: quintOut,
  })

  emitter.on("close", () => modalHeight.set(0))
</script>

<script lang="ts">
  import {onMount} from "svelte"
  import {quintOut} from "svelte/easing"
  import {tweened} from "svelte/motion"

  export let component
  export let props = {}

  let box: HTMLElement
  let content: HTMLElement
  let naturalHeight = 0

  onMount(() => {
    naturalHeight = content.clientHeight + 48
    modalHeight.set(naturalHeight)
  })
</script>

<div
  class="modal-box"
  bind:this={box}
  style={`height: ${$modalHeight}px`}
  class:overflow-hidden={$modalHeight !== naturalHeight}>
  <div bind:this={content}>
    <svelte:component this={component} {...props} />
  </div>
</div>
