<script lang="ts">
  import {onMount} from "svelte"
  import {defer} from "hurdak"
  import {Tags} from 'paravel'
  import {Naddr, getIdOrAddress, noteKinds} from "src/util/nostr"
  import {fly} from "src/util/transition"
  import Modal from "src/partials/Modal.svelte"
  import Content from "src/partials/Content.svelte"
  import Heading from "src/partials/Heading.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import OverflowMenu from "src/partials/OverflowMenu.svelte"
  import Feed from "src/app/shared/Feed.svelte"
  import EventDate from "src/app/shared/EventDate.svelte"
  import EventInfo from "src/app/shared/EventInfo.svelte"
  import NoteReply from "src/app/shared/NoteReply.svelte"
  import type {Event} from "src/engine"
  import {dereferenceNote} from "src/engine"

  export let address

  const cancelReply = () => {
    replyIsOpen = false
  }

  let event
  let actions = []
  let replyIsOpen = false
  let promise: Promise<Event> = defer()

  $: {
    actions = []

    if (event) {
      actions.push({
        onClick: () => {
          replyIsOpen = true
        },
        label: "Leave a comment",
        icon: "message",
      })
    }
  }

  onMount(() => {
    promise = dereferenceNote(Naddr.fromTagValue(address))
    promise.then(e => {
      event = e
    })
  })
</script>

{#await promise}
  <Spinner />
{:then event}
  <div in:fly={{y: 20}}>
    <Content>
      <div class="flex gap-4">
        <EventDate {event} />
        <EventInfo {event}>
          <OverflowMenu actions={actions} />
        </EventInfo>
      </div>
      <Feed
        hideSpinner
        hideControls
        shouldListen
        anchor={getIdOrAddress(event)}
        filter={{kinds: noteKinds, '#a': [address]}} />
    </Content>
  </div>
  {#if replyIsOpen}
    <Modal onEscape={cancelReply}>
      <Content>
        <div class="text-center">
          <Heading>Leave a comment</Heading>
          <p>On "{Tags.from(event).getValue("name")}"</p>
        </div>
        <NoteReply forceOpen parent={event} on:reset={cancelReply} />
      </Content>
    </Modal>
  {/if}
{/await}
