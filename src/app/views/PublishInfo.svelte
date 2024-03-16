<script lang="ts">
  import {union} from "hurdak"
  import Content from "src/partials/Content.svelte"
  import Heading from "src/partials/Heading.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import RelayCard from "src/app/shared/RelayCard.svelte"
  import {Publisher} from "src/engine"
  import {toastProgress} from "src/app/state"
  import {router} from "src/app/router"

  export let eid
  export let relays
  export let event = null
  export let progress = null

  const retry = () => {
    const relays = Array.from(union(progress.timeouts, progress.failed)) as string[]

    Publisher.publish({relays, event}).on("progress", toastProgress)

    router.pop()
  }

  if (!progress) {
    router.at("/").replace()
  }
</script>

<Content size="lg">
  {#if progress}
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
        <Anchor button on:click={retry}>Try again</Anchor>
      {/if}
      {#if progress.succeeded.size > 0}
        <Anchor
          button
          accent
          href={router
            .at("notes")
            .of(eid, {relays: Array.from(progress.succeeded)})
            .toString()}>
          View your note
        </Anchor>
      {/if}
    </div>
  {:else}
    <Heading>Note Status</Heading>
    <p>This note has was found on the following relays:</p>
    <div class="flex flex-col gap-2">
      {#each relays as url}
        <RelayCard relay={{url}} />
      {/each}
    </div>
  {/if}
</Content>
