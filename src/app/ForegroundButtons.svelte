<script lang="ts">
  import {nip19} from "nostr-tools"
  import {fade} from "src/util/transition"
  import {modal, location} from "src/partials/state"
  import {canSign} from "src/engine"
  import ForegroundButton from "src/partials/ForegroundButton.svelte"
  import ForegroundButtons from "src/partials/ForegroundButtons.svelte"
  import MusicPlayer from "src/app/MusicPlayer.svelte"

  let scrollY = 0
  let playerIsOpen = false

  $: showButtons = !$location.pathname.match(
    /conversations|channels|chat|relays|keys|settings|logout$/
  )

  const scrollToTop = () => document.body.scrollIntoView({behavior: "smooth"})

  const showPlayer = () => {
    playerIsOpen = true
  }

  const createNote = () => {
    const pubkeyMatch = $location.pathname.match(/people\/(npub1[0-9a-z]+)/)
    const pubkey = pubkeyMatch ? nip19.decode(pubkeyMatch[1]).data : null

    modal.push({type: "note/create", pubkey})
  }
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
