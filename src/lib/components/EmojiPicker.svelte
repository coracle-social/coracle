<script lang="ts">
  import "emoji-picker-element"
  import type {Emoji} from "emoji-picker-element/shared"
  import {onMount} from "svelte"

  export let onClick: (emoji: Emoji) => void

  let element: Element

  onMount(() => {
    element.addEventListener("emoji-click", (event: any) => onClick(event.detail as Emoji))
  })
</script>

<emoji-picker bind:this={element} />
