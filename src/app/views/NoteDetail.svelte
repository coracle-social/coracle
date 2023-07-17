<script>
  import {propEq} from "ramda"
  import {onMount, onDestroy} from "svelte"
  import {fly} from "src/util/transition"
  import {isMobile} from "src/util/html"
  import {asDisplayEvent} from "src/util/nostr"
  import Content from "src/partials/Content.svelte"
  import RelayFeed from "src/app/shared/RelayFeed.svelte"
  import Modal from "src/partials/Modal.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import {nip65, network} from "src/app/engine"
  import Note from "src/app/shared/Note.svelte"

  export let note
  export let relays = []
  export let invertColors = false

  console.log(nip65.selectHints(3, relays))
  const feed = network.feed({
    depth: 6,
    relays: nip65.selectHints(3, relays),
    filter: {ids: [note.id]},
  })

  const depth = isMobile ? 3 : 6

  const setFeedRelay = relay => {
    feedRelay = relay
  }

  let loading = true
  let feedRelay = null
  let displayNote = feed.feed.derived($feed => {
    console.log($feed)
    const found = find(propEq("id", note.id), $feed)

    //if (found) {
    loading = false
    //}

    return asDisplayEvent(found || note)
  })

  onMount(() => {
    feed.start()
    feed.loadAll()
  })

  onDestroy(() => feed.stop())
</script>

{#if !loading && !$displayNote.pubkey}
  <div in:fly={{y: 20}}>
    <Content size="lg" class="text-center">Sorry, we weren't able to find this note.</Content>
  </div>
{:else if $displayNote.pubkey}
  <div in:fly={{y: 20}} class="m-auto flex w-full max-w-2xl flex-col gap-4 p-4">
    <Note
      showContext
      anchorId={note.id}
      note={$displayNote}
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
    <RelayFeed {feedRelay} notes={[$displayNote]} depth={6} showContext />
  </Modal>
{/if}
