<script lang="ts">
  import {fly} from "src/util/transition"
  import {isMobile} from "src/util/html"
  import RelayFeed from "src/app/shared/RelayFeed.svelte"
  import Modal from "src/partials/Modal.svelte"
  import Note from "src/app/shared/Note.svelte"

  export let note
  export let relays = []
  export let invertColors = false
  export let depth = isMobile ? 2 : 5
  export let setFeedRelay = relay => {
    feedRelay = relay
  }

  let feedRelay = null
</script>

<div in:fly={{y: 20}} class="m-auto flex w-full max-w-2xl flex-col gap-4 p-4">
  <Note
    showContext
    anchorId={note.id}
    {note}
    {depth}
    {relays}
    {invertColors}
    {feedRelay}
    {setFeedRelay} />
</div>

{#if feedRelay}
  <Modal onEscape={() => setFeedRelay(null)}>
    <RelayFeed {feedRelay} notes={[note]} depth={6} showContext />
  </Modal>
{/if}
