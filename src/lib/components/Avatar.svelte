<script lang="ts">
  import cx from "classnames"
  import Icon from "@lib/components/Icon.svelte"

  export let src = ""
  export let size = 7
  export let icon = "user-rounded"
</script>

{#if src}
  <div
    class={cx($$props.class, "shrink-0 overflow-hidden rounded-full bg-cover bg-center")}
    style={`width: ${size * 4}px; height: ${size * 4}px; min-width: ${size * 4}px; background-image: url(${src}); ${$$props.style || ""}`} />
{:else}
  <div
    class={cx($$props.class, "center !flex rounded-full")}
    style={`width: ${size * 4}px; height: ${size * 4}px; min-width: ${size * 4}px; ${$$props.style || ""}`}>
    <Icon {icon} size={Math.round(size * 0.8)} />
  </div>
{/if}
