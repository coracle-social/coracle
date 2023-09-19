<script lang="ts">
  import {isMobile} from "src/util/html"
  import Content from "src/partials/Content.svelte"
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

<Content>
  <Note
    showContext
    anchorId={note.id}
    {note}
    {depth}
    {relays}
    {invertColors}
    {feedRelay}
    {setFeedRelay} />
</Content>

{#if feedRelay}
  <Modal onEscape={() => setFeedRelay(null)}>
    <RelayFeed {feedRelay} notes={[note]} depth={6} showContext />
  </Modal>
{/if}
