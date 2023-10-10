<script lang="ts">
  import {find, whereEq} from "ramda"
  import {isMobile} from "src/util/html"
  import Content from "src/partials/Content.svelte"
  import RelayFeed from "src/app/shared/RelayFeed.svelte"
  import Modal from "src/partials/Modal.svelte"
  import Note from "src/app/shared/Note.svelte"

  export let eid
  export let relays = []
  export let context = []
  export let depth = isMobile ? 2 : 5
  export let setFeedRelay = relay => {
    feedRelay = relay
  }

  const note = find(whereEq({id: eid}), context) || {id: eid}

  let feedRelay = null
</script>

<Content>
  <Note showLoading anchorId={eid} {note} {depth} {relays} {context} {feedRelay} {setFeedRelay} />
</Content>

{#if feedRelay}
  <Modal onEscape={() => setFeedRelay(null)}>
    <RelayFeed {feedRelay} notes={[note]} depth={6} />
  </Modal>
{/if}
