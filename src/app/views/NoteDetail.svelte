<script lang="ts">
  import {first} from "hurdak"
  import {onMount, onDestroy} from "svelte"
  import {fly} from "src/util/transition"
  import {info} from "src/util/logger"
  import {isMobile} from "src/util/html"
  import {asDisplayEvent} from "src/util/nostr"
  import Content from "src/partials/Content.svelte"
  import RelayFeed from "src/app/shared/RelayFeed.svelte"
  import Modal from "src/partials/Modal.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import Note from "src/app/shared/Note.svelte"
  import {load, ContextLoader, selectHints, getIdFilters} from "src/engine2"

  export let note
  export let relays = []
  export let invertColors = false
  export let depth = isMobile ? 3 : 6
  export let setFeedRelay = relay => {
    feedRelay = relay
  }

  const context = new ContextLoader({
    filters: getIdFilters([note.id]),
    onEvent: e => {
      // Update feed, but only if we have loaded an actual note
      if (displayNote.sig) {
        displayNote = first(context.applyContext([displayNote]))
      }
    },
  })

  let loading = true
  let feedRelay = null
  let displayNote = asDisplayEvent(note)

  onMount(async () => {
    // If our note came from a feed, we can preload context
    context.hydrate([displayNote], depth)

    load({
      filters: getIdFilters([note.id]),
      relays: selectHints(relays),
      onEvent: e => {
        context.addContext([e], {depth})

        displayNote = first(context.applyContext([e]))
        loading = false
      },
    })

    info("NoteDetail", displayNote)
  })

  onDestroy(() => {
    context.stop()
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
      anchorId={displayNote.id}
      note={displayNote}
      {depth}
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
