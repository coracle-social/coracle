<script lang="ts">
  import cx from "classnames"
  import Icon from "@lib/components/Icon.svelte"

  export let src
  export let size = 7
</script>

<div
  class={cx($$props.class, "!flex items-center justify-center overflow-hidden rounded-full")}
  style={`width: ${size * 4}px; height: ${size * 4}px;`}>
  {#if src}
    <img alt="" {src} />
  {:else}
    <Icon icon="user-rounded" size={Math.round(size * 0.7)} />
  {/if}
</div>
