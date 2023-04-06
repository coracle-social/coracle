<script lang="ts">
  import {displayRelay} from "src/util/nostr"
  import Content from "src/partials/Content.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import RelayTitle from "src/views/relays/RelayTitle.svelte"
  import RelayActions from "src/views/relays/RelayActions.svelte"
  import Note from "src/views/notes/Note.svelte"

  export let depth
  export let showContext = false
  export let feedRelay
  export let notes

  $: filteredNotes = notes.filter(n => n.seen_on.includes(feedRelay.url))
</script>

<Content>
  <div class="flex items-center justify-between gap-2">
    <RelayTitle relay={feedRelay} />
    <RelayActions relay={feedRelay} />
  </div>
  {#if feedRelay.description}
    <p>{feedRelay.description}</p>
  {/if}
  <p class="text-gray-4">
    <i class="fa fa-info-circle" />
    Below is your current feed including only notes seen on {displayRelay(feedRelay)}
  </p>

  <div class="flex flex-col gap-4">
    <!-- If someone clicks on a child note that was seen on a relay the parent was not
         seen on, we get nothing, so just show everything - but pass down the filter -->
    {#each filteredNotes.length > 0 ? filteredNotes : notes as note (note.id)}
      <Note invertColors {depth} {note} {feedRelay} {showContext} />
    {/each}
  </div>

  <Spinner />
</Content>
