<script lang="ts">
  import cx from "classnames"
  import {elasticOut} from "svelte/easing"
  import {fly} from "src/util/transition"
  import Link from "src/partials/Link.svelte"

  export let path = null
  export let isActive = false
  export let small = false
  export let short = innerHeight < 650

  $: className = cx("relative staatliches block transition-all", $$props.class, {
    "h-10": !small && short,
    "h-12": !small && !short,
    "h-10 text-lg": small,
    "text-3xl": !small && isActive,
    "text-2xl": !small && !isActive,
    "text-accent": isActive,
    "text-tinted-400 hover:text-tinted-100": !isActive,
  })
</script>

<Link {...$$props} randomizeKey class={className} href={path} on:click>
  <div class="absolute left-8 flex gap-5 whitespace-nowrap pt-2" class:-right-3={isActive}>
    <slot />
    {#if isActive}
      <div
        in:fly|local={{x: 50, duration: 1000, easing: elasticOut}}
        class="relative h-px w-full bg-accent"
        class:top-4={!small}
        class:top-3={small} />
    {/if}
  </div>
</Link>
