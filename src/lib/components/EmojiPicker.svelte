<style>
  @media (max-width: 450px) {
    emoji-picker {
      max-width: 100%;
      --num-columns: 6;
      --category-emoji-size: 1.125rem;
    }
  }
</style>

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

<emoji-picker bind:this={element}></emoji-picker>
