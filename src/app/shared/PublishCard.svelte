<script lang="ts">
  import {nthEq, remove, first} from "@welshman/lib"
  import {LOCAL_RELAY_URL} from "@welshman/util"
  import type {TrustedEvent} from "@welshman/util"
  import {PublishStatus} from "@welshman/net"
  import {formatTimestamp} from "src/util/misc"
  import {slide, fly} from "src/util/transition"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Card from "src/partials/Card.svelte"
  import RelayCard from "src/app/shared/RelayCard.svelte"
  import {router} from "src/app/util/router"
  import type {PublishInfo} from "src/engine"
  import {publish, ensureUnwrapped} from "src/engine"

  export let pub: PublishInfo

  const promise = ensureUnwrapped(pub.request.event)

  const retry = (url: string, event: TrustedEvent) =>
    publish({relays: [url], event: pub.request.event})

  const getUrls = (status: PublishStatus) =>
    remove(LOCAL_RELAY_URL, Array.from(pub.status).filter(nthEq(1, status)).map(first))

  const open = (event: TrustedEvent) =>
    router
      .at("notes")
      .of(event.id)
      .cx({context: [event]})
      .open()

  const expand = () => {
    expanded = true
  }

  const collapse = () => {
    expanded = false
  }

  let expanded = false

  $: pending = getUrls(PublishStatus.Pending)
  $: success = getUrls(PublishStatus.Success)
  $: failure = getUrls(PublishStatus.Failure)
  $: timeout = getUrls(PublishStatus.Timeout)
</script>

{#await promise}
  <!-- pass -->
{:then event}
  <div in:fly|local={{y: 20}}>
    <Card>
      <FlexColumn>
        <div class="flex justify-between">
          <span>Kind {event.kind}, published {formatTimestamp(pub.created_at)}</span>
          <Anchor underline modal class="text-sm" on:click={() => open(event)}>View Note</Anchor>
        </div>
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
{/await}
