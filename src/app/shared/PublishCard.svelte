<script lang="ts">
  import type {Thunk, ThunkStatusByRelay} from "@welshman/app"
  import {first, nthEq, remove} from "@welshman/lib"
  import {PublishStatus} from "@welshman/net"
  import type {SignedEvent, TrustedEvent} from "@welshman/util"
  import {LOCAL_RELAY_URL} from "@welshman/relay"
  import RelayCard from "src/app/shared/RelayCard.svelte"
  import {router} from "src/app/util/router"
  import {ensureUnwrapped, publish} from "src/engine"
  import Anchor from "src/partials/Anchor.svelte"
  import Card from "src/partials/Card.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Note from "src/app/shared/Note.svelte"
  import NoteReducer from "src/app/shared/NoteReducer.svelte"
  import {formatTimestamp} from "src/util/misc"
  import {fly, slide} from "src/util/transition"

  export let thunk: Thunk

  $: status = thunk.status

  const promise = ensureUnwrapped(thunk.event)

  const retry = (url: string, event: TrustedEvent) =>
    publish({relays: [url], event: thunk.event as SignedEvent})

  const getUrls = (m: ThunkStatusByRelay, status: PublishStatus) =>
    remove(
      LOCAL_RELAY_URL,
      Object.entries(m || {})
        .map(e => [e[0], e[1].status])
        .filter(nthEq(1, status))
        .map(first),
    )

  const open = (event: TrustedEvent) => router.at("notes").of(event.id).open()

  const expand = () => {
    expanded = true
  }

  const collapse = () => {
    expanded = false
  }

  let expanded = false

  $: pending = getUrls($status, PublishStatus.Pending)
  $: success = getUrls($status, PublishStatus.Success)
  $: failure = getUrls($status, PublishStatus.Failure)
  $: timeout = getUrls($status, PublishStatus.Timeout)
</script>

{#await promise}
  <!-- pass -->
{:then event}
  {#if event}
    <div in:fly|local={{y: 20}}>
      <Card>
        <FlexColumn>
          <div class="flex justify-between">
            <span>Kind {event.kind}, published {formatTimestamp(thunk.event.created_at)}</span>
            <Anchor underline modal class="text-sm" on:click={() => open(event)}>View Note</Anchor>
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
              <Anchor class="flex items-center gap-2" on:click={collapse}>
                <i class="fa fa-caret-up" />
                <span class="text-underline">Hide Details</span>
              </Anchor>
            {:else}
              <Anchor class="flex items-center gap-2" on:click={expand}>
                <i class="fa fa-caret-down" />
                <span class="text-underline">Show Details</span>
              </Anchor>
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
                        <Anchor
                          on:click={() => retry(url, event)}
                          class="flex items-center gap-2 text-sm">
                          <i class="fa fa-rotate" /> Retry
                        </Anchor>
                      </div>
                    </RelayCard>
                  {/each}
                {/if}
                {#if timeout.length > 0}
                  <p class="mt-4 text-lg">The following relays did not respond:</p>
                  {#each timeout as url}
                    <RelayCard {url}>
                      <div slot="actions">
                        <Anchor
                          on:click={() => retry(url, event)}
                          class="flex items-center gap-2 text-sm">
                          <i class="fa fa-rotate" /> Retry
                        </Anchor>
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
{/await}
