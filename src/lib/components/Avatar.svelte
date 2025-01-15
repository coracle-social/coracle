<script lang="ts">
  import Icon from "@lib/components/Icon.svelte"

  export let src = ""
  export let size = 7
  export let icon = "user-rounded"

  $: rem = size * 4
</script>

<div
  class="{$$props.class} relative !flex shrink-0 items-center justify-center overflow-hidden rounded-full"
  style="width: {rem}px; height: {rem}px; min-width: {rem}px; {$$props.style || ''}">
  <Icon {icon} size={Math.round(size * 0.8)} />
  <div
    class="absolute left-0 top-0 h-full w-full bg-cover bg-center"
    style="background-image: url({src})" />
</div>
