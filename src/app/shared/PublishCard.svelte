<script lang="ts">
  import {formatTimestamp, remove} from "@welshman/lib"
  import type {Thunk} from "@welshman/app"
  import {PublishStatus, LOCAL_RELAY_URL} from "@welshman/net"
  import type {TrustedEvent} from "@welshman/util"
  import {app, thunks} from "src/engine/core"
  import RelayCard from "src/app/shared/RelayCard.svelte"
  import {router} from "src/app/util/router"
  import Button from "src/partials/Button.svelte"
  import Link from "src/partials/Link.svelte"
  import Card from "src/partials/Card.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Note from "src/app/shared/Note.svelte"
  import NoteReducer from "src/app/shared/NoteReducer.svelte"
  import {fly, slide} from "src/util/transition"

  export let thunk: Thunk

  const retry = (url: string, event: TrustedEvent) =>
    $thunks.publish({relays: [url], event: thunk.event})

  const expand = () => {
    expanded = true
  }

  const collapse = () => {
    expanded = false
  }

  let expanded = false

  // A gift-wrapped event is published as its wrap, so show the rumor it carries
  $: event = $app.wrapManager.getRumor(thunk.event.id) || thunk.event
  $: pending = remove(LOCAL_RELAY_URL, $thunk.getUrlsWithStatus(PublishStatus.Pending))
  $: success = remove(LOCAL_RELAY_URL, $thunk.getUrlsWithStatus(PublishStatus.Success))
  $: failure = remove(LOCAL_RELAY_URL, $thunk.getUrlsWithStatus(PublishStatus.Failure))
  $: timeout = remove(LOCAL_RELAY_URL, $thunk.getUrlsWithStatus(PublishStatus.Timeout))
</script>

{#if event}
  <div in:fly|local={{y: 20}}>
    <Card>
      <FlexColumn>
        <div class="flex justify-between">
          <span>Kind {event.kind}, published {formatTimestamp(thunk.event.created_at)}</span>
          <Link class="text-sm underline" modal href={router.at("notes").of(event.id).toString()}
            >View Note</Link>
        </div>
        <NoteReducer events={[event]} let:event>
          <Note {event} />
        </NoteReducer>
        <div class="flex justify-between text-sm">
          <div class="hidden gap-4 sm:flex">
            <span class="flex items-center gap-2">
              <i class="fa fa-check" />
              {success.length} succeeded
            </span>
            {#if pending.length > 0}
              <span class="flex items-center gap-2">
                <i class="fa fa-circle-notch fa-spin" />
                {pending.length} pending
              </span>
            {/if}
            {#if failure.length > 0}
              <span class="flex items-center gap-2">
                <i class="fa fa-triangle-exclamation" />
                {failure.length} failed
              </span>
            {/if}
            {#if timeout.length > 0}
              <span class="flex items-center gap-2">
                <i class="fa fa-stopwatch" />
                {timeout.length} timed out
              </span>
            {/if}
          </div>
          {#if expanded}
            <Button class="flex items-center gap-2" on:click={collapse}>
              <i class="fa fa-caret-up" />
              <span class="text-underline">Hide Details</span>
            </Button>
          {:else}
            <Button class="flex items-center gap-2" on:click={expand}>
              <i class="fa fa-caret-down" />
              <span class="text-underline">Show Details</span>
            </Button>
          {/if}
        </div>
        {#if expanded}
          <div transition:slide|local>
            <FlexColumn>
              {#if pending.length > 0}
                <p class="mt-4 text-lg">The following relays are still pending:</p>
                <div class="grid gap-2 sm:grid-cols-2">
                  {#each pending as url}
                    <RelayCard hideActions {url} />
                  {/each}
                </div>
              {/if}
              {#if success.length > 0}
                <p class="mt-4 text-lg">The following relays accepted your note:</p>
                <div class="grid gap-2 sm:grid-cols-2">
                  {#each success as url}
                    <RelayCard hideActions {url} />
                  {/each}
                </div>
              {/if}
              {#if failure.length > 0}
                <p class="mt-4 text-lg">The following relays rejected your note:</p>
                {#each failure as url}
                  <RelayCard {url}>
                    <div slot="actions">
                      <Button
                        on:click={() => retry(url, event)}
                        class="flex items-center gap-2 text-sm">
                        <i class="fa fa-rotate" /> Retry
                      </Button>
                    </div>
                  </RelayCard>
                {/each}
              {/if}
              {#if timeout.length > 0}
                <p class="mt-4 text-lg">The following relays did not respond:</p>
                {#each timeout as url}
                  <RelayCard {url}>
                    <div slot="actions">
                      <Button
                        on:click={() => retry(url, event)}
                        class="flex items-center gap-2 text-sm">
                        <i class="fa fa-rotate" /> Retry
                      </Button>
                    </div>
                  </RelayCard>
                {/each}
              {/if}
            </FlexColumn>
          </div>
        {/if}
      </FlexColumn>
    </Card>
  </div>
{/if}
