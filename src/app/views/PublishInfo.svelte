<script lang="ts">
  import {union} from "hurdak"
  import {nip19} from "nostr-tools"
  import {modal} from "src/partials/state"
  import Content from "src/partials/Content.svelte"
  import Heading from "src/partials/Heading.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import RelayCard from "src/app/shared/RelayCard.svelte"
  import {Publisher} from "src/engine"
  import {toastProgress} from "src/app/state"

  export let event
  export let progress

  const {succeeded, timeouts, failed} = progress

  const noteLink =
    "/" +
    nip19.neventEncode({
      id: event.id,
      relays: Array.from(succeeded),
    })

  const retry = () => {
    const relays = Array.from(union(timeouts, failed)) as string[]

    Publisher.publish({relays, event}).on("progress", toastProgress)

    modal.pop()
  }
</script>

<Content size="lg">
  {#if progress.succeeded.size > 0}
    <Heading>Success!</Heading>
    <p>Your note has been published to the following relays:</p>
    <div class="flex flex-col gap-2">
      {#each Array.from(progress.succeeded) as url}
        <RelayCard relay={{url}} />
      {/each}
    </div>
  {:else}
    <Heading>Failed to publish!</Heading>
    <p>Your note was not published.</p>
  {/if}
  {#if progress.failed.size > 0}
    <p>The following relays rejected your note:</p>
    <div class="flex flex-col gap-2">
      {#each Array.from(progress.failed) as url}
        <RelayCard relay={{url}} />
      {/each}
    </div>
  {/if}
  {#if progress.timeouts.size > 0}
    <p>The following relays did not respond:</p>
    <div class="flex flex-col gap-2">
      {#each Array.from(progress.timeouts) as url}
        <RelayCard relay={{url}} />
      {/each}
    </div>
  {/if}
  <div class="flex justify-center gap-2">
    {#if progress.succeeded.size < progress.attempted.size}
      <Anchor theme="button" on:click={retry}>Try again</Anchor>
    {/if}
    {#if progress.succeeded.size > 0}
      <Anchor theme="button-accent" href={noteLink}>View your note</Anchor>
    {/if}
  </div>
</Content>
