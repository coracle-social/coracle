<script lang="ts">
  import cx from "classnames"
  import {elasticOut} from "svelte/easing"
  import {fly} from "src/util/transition"
  import Anchor from "src/partials/Anchor.svelte"

  export let path = null
  export let isAlt = false
  export let isActive = false

  $: className = cx("relative staatliches h-12 block transition-all", $$props.class, {
    "text-3xl text-accent": isActive,
    "text-2xl text-tinted-400 hover:text-tinted-100": !isActive,
    "hover:bg-tinted-800": !isActive && !isAlt,
    "hover:bg-tinted-700": !isActive && isAlt,
  })
</script>

<Anchor {...$$props} randomizeKey class={className} href={path} on:click>
  <div class="absolute left-6 flex gap-5 whitespace-nowrap pt-2" class:-right-3={isActive}>
    <slot />
    {#if isActive}
      <div
        in:fly|local={{x: 50, duration: 1000, easing: elasticOut}}
        class="relative top-4 h-px w-full bg-accent" />
    {/if}
  </div>
</Anchor>
