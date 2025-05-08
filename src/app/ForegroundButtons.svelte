<script lang="ts">
  import {onMount} from "svelte"
  import {fade} from "src/util/transition"
  import ForegroundButton from "src/partials/ForegroundButton.svelte"

  let scrollY = 0

  const setScroll = () => {
    scrollY = window.scrollY
  }

  const scrollToTop = () => document.body.scrollIntoView({behavior: "smooth"})

  // Interval is more performant than binding to scrollY
  onMount(() => {
    const interval = setInterval(setScroll, 1000)

    return () => clearInterval(interval)
  })
</script>

<div
  class="fixed bottom-[calc(var(--saib)+4.5rem)] right-[calc(var(--sair)+1rem)] z-feature flex flex-col items-center gap-3 lg:bottom-8 lg:right-8">
  {#if scrollY > 1000}
    <div transition:fade|local={{delay: 200, duration: 200}}>
      <ForegroundButton theme="secondary" size="small" on:click={scrollToTop}>
        <i class="fa fa-arrow-up" />
      </ForegroundButton>
    </div>
  {/if}
</div>
