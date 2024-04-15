<script lang="ts">
  import cx from "classnames"
  import {elasticOut} from "svelte/easing"
  import {fly} from "src/util/transition"
  import Anchor from "src/partials/Anchor.svelte"
  import {router} from "src/app/util/router"

  export let path = null

  const {page} = router

  $: isActive = path && $page?.path.startsWith(path)

  $: className = cx("relative staatliches h-12 block transition-all", {
    "text-3xl text-accent": isActive,
    "text-2xl text-tinted-400 hover:text-tinted-100 hover:bg-tinted-800":
      !isActive,
  })
</script>

<Anchor {...$$props} randomizeKey class={className} href={path} on:click>
  <div class="absolute left-8 flex gap-5 whitespace-nowrap pt-2" class:-right-6={isActive}>
    <slot />
    {#if isActive}
      <div
        in:fly|local={{x: 50, duration: 1000, easing: elasticOut}}
        class="relative top-4 h-px w-full bg-accent" />
    {/if}
  </div>
</Anchor>
