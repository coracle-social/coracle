<script lang="ts">
  import {onMount} from "svelte"
  import Icon from "@lib/components/Icon.svelte"

  const {src = "", size = 7, icon = "user-rounded", style = "", ...restProps} = $props()

  let element: HTMLElement

  const rem = $derived(size * 4)

  onMount(() => {
    if (src) {
      const image = new Image()

      image.addEventListener("error", () => {
        element.querySelector(".hidden")?.classList.remove("hidden")
      })

      image.src = src
    }
  })
</script>

<div
  bind:this={element}
  class="{restProps.class} relative !flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-cover bg-center"
  style="width: {rem}px; height: {rem}px; min-width: {rem}px; background-image: url({src}); {style}">
  <Icon {icon} class={src ? "hidden" : ""} size={Math.round(size * 0.8)} />
</div>
