<script lang="ts">
  import {nip19} from "nostr-tools"
  import {navigate} from "svelte-routing"
  import {fade} from "src/util/transition"
  import {user} from "src/app/engine"
  import {modal, location} from "src/partials/state"

  let scrollY = 0

  $: showCreateNote = $location.pathname.match(/messages|chat|relays$|keys|settings|logout$/)
  $: showLogin = !$location.pathname.match(/login$/)

  const {canSign} = user.keys

  const scrollToTop = () => document.body.scrollIntoView({behavior: "smooth"})

  const createNote = () => {
    const pubkeyMatch = $location.pathname.match(/people\/(npub1[0-9a-z]+)/)
    const pubkey = pubkeyMatch ? nip19.decode(pubkeyMatch[1]).data : null
    const relayMatch = $location.pathname.match(/relays\/(.+)/)
    const relay = relayMatch ? relayMatch[1] : null
    const relays = relay ? [relay] : null

    modal.push({type: "note/create", pubkey, relays})
  }
</script>

<svelte:window bind:scrollY />

<div class="fixed bottom-0 right-0 z-10 m-8 flex flex-col items-center gap-3">
  {#if scrollY > 1000}
    <button
      transition:fade|local={{delay: 200, duration: 200}}
      class="flex h-12 w-12 items-center justify-center rounded-full
          border border-gray-8 bg-gray-7 text-gray-1 shadow-2xl
          transition-all hover:scale-105 hover:bg-gray-6"
      on:click={scrollToTop}>
      <i class="fa fa-arrow-up" />
    </button>
  {/if}
  {#if $canSign && !showCreateNote}
    <button
      class="color-white flex h-16 w-16 items-center justify-center rounded-full
            border border-accent-light bg-accent text-white shadow-2xl
            transition-all hover:scale-105 hover:bg-accent-light"
      on:click={createNote}>
      <i class="fa fa-plus" />
    </button>
  {/if}
  {#if !$canSign && showLogin}
    <button
      class="color-white flex h-16 w-16 items-center justify-center rounded-full
            border border-accent-light bg-accent text-white shadow-2xl
            transition-all hover:scale-105 hover:bg-accent-light"
      on:click={() => navigate("/login")}>
      <i class="fa fa-right-to-bracket" />
    </button>
  {/if}
</div>
