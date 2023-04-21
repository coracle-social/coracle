<script>
  import {onMount, onDestroy} from "svelte"
  import {nip19} from "nostr-tools"
  import {fly} from "svelte/transition"
  import {first} from "hurdak/lib/hurdak"
  import {log} from "src/util/logger"
  import {isMobile} from "src/util/html"
  import {asDisplayEvent} from "src/util/nostr"
  import Content from "src/partials/Content.svelte"
  import RelayFeed from "src/app/shared/RelayFeed.svelte"
  import Modal from "src/partials/Modal.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import Note from "src/app/shared/Note.svelte"
  import user from "src/agent/user"
  import network from "src/agent/network"
  import {sampleRelays} from "src/agent/relays"

  export let note
  export let relays = []
  export let invertColors = false

  let sub = null
  let loading = true
  let feedRelay = null
  let displayNote = asDisplayEvent(note)

  const setFeedRelay = relay => {
    feedRelay = relay
  }

  onMount(async () => {
    if (!displayNote.pubkey) {
      await network.load({
        relays: sampleRelays(relays),
        filter: {kinds: [1], ids: [displayNote.id]},
        onChunk: events => {
          displayNote = asDisplayEvent(first(events))
        },
      })
    }

    if (displayNote) {
      log("NoteDetail", nip19.noteEncode(displayNote.id), displayNote)

      sub = network.streamContext({
        maxDepth: isMobile ? 3 : 6,
        notes: [displayNote],
        onChunk: context => {
          displayNote = first(network.applyContext([displayNote], user.applyMutes(context)))
        },
      })
    }

    loading = false
  })

  onDestroy(() => {
    sub?.unsub()
  })
</script>

{#if !loading && !displayNote.pubkey}
  <div in:fly={{y: 20}}>
    <Content size="lg" class="text-center">Sorry, we weren't able to find this note.</Content>
  </div>
{:else if displayNote.pubkey}
  <div in:fly={{y: 20}} class="m-auto flex w-full max-w-2xl flex-col gap-4 p-4">
    <Note
      showContext
      depth={6}
      anchorId={displayNote.id}
      note={displayNote}
      {invertColors}
      {feedRelay}
      {setFeedRelay} />
  </div>
{/if}

{#if loading}
  <Spinner />
{/if}

{#if feedRelay}
  <Modal onEscape={() => setFeedRelay(null)}>
    <RelayFeed {feedRelay} notes={[displayNote]} depth={6} showContext />
  </Modal>
{/if}
