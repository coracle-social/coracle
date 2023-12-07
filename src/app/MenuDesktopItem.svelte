<script lang="ts">
  import cx from 'classnames'
  import {elasticOut} from 'svelte/easing'
  import {fly} from 'src/util/transition'
  import Anchor from "src/partials/Anchor.svelte"
  import {router} from "src/app/router"

  export let path

  const {page} = router

  $: isActive = $page.path.startsWith(path)

  $: className = cx("relative staatliches h-12 block transition-all", {
    'text-2xl text-accent': isActive,
    'text-lg hover:bg-accent hover:text-white': !isActive,
  })
</script>

<Anchor {...$$props} class={className} href={path} on:click>
  <div class="absolute py-3 left-8 -right-6 flex gap-5 whitespace-nowrap">
    <slot />
    {#if isActive}
      <div in:fly|local={{x: 50, duration: 1000, easing: elasticOut}} class="relative top-4 h-px bg-accent w-full" />
    {/if}
  </div>
</Anchor>

