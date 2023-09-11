<script>
  import {first} from "hurdak"
  import {ContextLoader} from "src/engine2"
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
  import {Subscription} from "src/engine2"
  import {Settings, Nip65} from "src/app/engine"

  export let note
  export let relays = []
  export let invertColors = false
  export let depth = isMobile ? 3 : 6
  export let setFeedRelay = relay => {
    feedRelay = relay
  }

  const context = new ContextLoader({
    filters: [{ids: [note.id]}],
    onEvent: e => {
      // Update feed, but only if we have loaded an actual note
      if (displayNote.sig) {
        displayNote = first(context.applyContext([displayNote]))
      }
    },
  })

  let sub
  let loading = true
  let feedRelay = null
  let displayNote = asDisplayEvent(note)

  onMount(async () => {
    // If our note came from a feed, we can preload context
    context.hydrate([displayNote], depth)

    sub = new Subscription({
      filters: [{ids: [note.id]}],
      timeout: 8000,
      relays: Nip65.selectHints(Settings.getSetting("relay_limit"), relays),
    })

    sub.on("event", e => {
      context.addContext([e], {depth})

      displayNote = first(context.applyContext([e]))

      sub.close()
    })

    await sub.result
    await Promise.all(context.getAllSubs())

    info("NoteDetail", displayNote)

    loading = false
  })

  onDestroy(() => {
    sub?.close()
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
      anchorId={note.id}
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
