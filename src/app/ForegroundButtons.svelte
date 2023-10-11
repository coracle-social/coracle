<script lang="ts">
  import {nip19} from "nostr-tools"
  import {fade} from "src/util/transition"
  import {canSign} from "src/engine"
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
    const pubkeyMatch = $page.path.match(/(npub1[0-9a-z]+)/)
    const pubkey = pubkeyMatch ? nip19.decode(pubkeyMatch[1]).data : null

    router.at("notes/create").qp({pubkey}).open()
  }

  $: showButtons = !$page?.path.match(/^\/conversations|channels|logout|settings/)
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
  {#if showButtons}
    <div transition:fade|local={{delay: 200, duration: 200}}>
      <ForegroundButton theme="secondary" size="small" on:click={showPlayer}>
        <i class="fa fa-music" />
      </ForegroundButton>
    </div>
  {/if}
  {#if $canSign && showButtons}
    <div out:fade|local={{delay: 200, duration: 200}}>
      <ForegroundButton on:click={createNote}>
        <i class="fa fa-plus" />
      </ForegroundButton>
    </div>
  {/if}
</ForegroundButtons>

<MusicPlayer bind:isOpen={playerIsOpen} />
