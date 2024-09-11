<script lang="ts">
  import {page} from "$app/stores"
  import type {TrustedEvent} from '@welshman/util'
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import Spinner from "@lib/components/Spinner.svelte"
  import EventCreate from "@app/components/EventCreate.svelte"
  import {pushModal} from "@app/modal"
  import {eventsByUrl, decodeNRelay} from "@app/state"

  const url = decodeNRelay($page.params.nrelay)

  const createEvent = () => pushModal(EventCreate)

  const getDateDisplay = (event: TrustedEvent, reset: boolean) => {
    if (reset) {
      prevEvent = undefined
    }

    return "hi"
  }

  let prevEvent
  let loading = true

  $: events = $eventsByUrl.get(url) || []

  setTimeout(() => {
    loading = false
  }, 3000)
</script>

<div class="relative flex h-screen flex-col">
  <div class="relative z-feature mx-2 rounded-xl pt-4">
    <div
      class="flex min-h-12 items-center justify-between gap-4 rounded-xl bg-base-100 px-4 shadow-xl">
      <div class="flex items-center gap-2">
        <Icon icon="calendar-minimalistic" />
        <strong>Calendar</strong>
      </div>
    </div>
  </div>
  <div class="-mt-2 flex flex-grow flex-col overflow-auto py-2">
    {#each events as event, i (event.id)}
      {@const dateDisplay = getDateDisplay(event, i === 0)}
      {#if dateDisplay}
        <div>{dateDisplay}</div>
      {/if}
      <div>{event.id}</div>
    {/each}
    <p class="flex h-10 items-center justify-center py-20">
      <Spinner {loading}>
        {#if loading}
          Looking for events...
        {:else if events.length === 0}
          No events found.
        {/if}
      </Spinner>
    </p>
  </div>
  <Button class="fixed bottom-4 right-4 tooltip tooltip-left p-1" data-tip="Create an Event" on:click={createEvent}>
    <div class="w-12 h-12 flex items-center justify-center btn btn-primary btn-circle">
      <Icon icon="widget-add" />
    </div>
  </Button>
</div>
