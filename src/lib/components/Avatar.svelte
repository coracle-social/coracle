<script lang="ts">
  import cx from "classnames"
  import Icon from "@lib/components/Icon.svelte"

  export let src
  export let alt = ""
  export let size = 7
  export let icon = "user-rounded"
</script>

<div
  class={cx($$props.class, "!flex overflow-hidden rounded-full")}
  class:center={!src}
  style={`width: ${size * 4}px; height: ${size * 4}px; min-width: ${size * 4}px;`}>
  {#if src}
    <img {alt} {src} />
  {:else}
    <Icon {icon} size={Math.round(size * 0.7)} />
  {/if}
</div>
