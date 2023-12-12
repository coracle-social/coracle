<script lang="ts">
  import {fade} from "src/util/transition"
  import ForegroundButton from "src/partials/ForegroundButton.svelte"
  import ForegroundButtons from "src/partials/ForegroundButtons.svelte"
  import {router} from "src/app/router"

  let scrollY = 0

  const {page} = router

  const scrollToTop = () => document.body.scrollIntoView({behavior: "smooth"})

  $: showButtons = !$page?.path.match(/^\/channels|logout|settings/)
</script>

<svelte:window bind:scrollY />

<ForegroundButtons>
  {#if scrollY > 1000}
    <div transition:fade|local={{delay: 200, duration: 200}}>
      <ForegroundButton theme="secondary" size="small" on:click={scrollToTop}>
        <i class="fa fa-arrow-up" />
      </ForegroundButton>
    </div>
  {/if}
</ForegroundButtons>
