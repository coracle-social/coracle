<script lang="ts">
  import {fade} from "src/util/transition"
  import {getProps} from "src/util/router"
  import {canSign, env} from "src/engine"
  import ForegroundButton from "src/partials/ForegroundButton.svelte"
  import ForegroundButtons from "src/partials/ForegroundButtons.svelte"
  import MusicPlayer from "src/app/MusicPlayer.svelte"
  import {router} from "src/app/router"

  let scrollY = 0
  let playerIsOpen = false

  const {page} = router

  const scrollToTop = () => document.body.scrollIntoView({behavior: "smooth"})

  const showPlayer = () => {
    playerIsOpen = true
  }

  const createNote = () => {
    const params = {} as any
    const props = getProps($page) as any

    if ($page.path.startsWith("/people") && props.pubkey) {
      params.pubkey = props.pubkey
    }

    if ($page.path.startsWith("/groups") && props.address) {
      params.group = props.address
    }

    router.at("notes/create").qp(params).open()
  }

  $: showButtons = !$page?.path.match(/^\/conversations|channels|logout|settings/)
</script>

<svelte:window bind:scrollY />

<!--
<ForegroundButtons>
  {#if scrollY > 1000}
    <div transition:fade|local={{delay: 200, duration: 200}}>
      <ForegroundButton theme="secondary" size="small" on:click={scrollToTop}>
        <i class="fa fa-arrow-up" />
      </ForegroundButton>
    </div>
  {/if}
  {#if showButtons && $env.ENABLE_JUKEBOX}
    <div transition:fade|local={{delay: 200, duration: 200}}>
      <ForegroundButton theme="secondary" size="small" on:click={showPlayer}>
        <i class="fa fa-music" />
      </ForegroundButton>
    </div>
  {/if}
</ForegroundButtons>
-->

{#if $env.ENABLE_JUKEBOX}
  <MusicPlayer bind:isOpen={playerIsOpen} />
{/if}
