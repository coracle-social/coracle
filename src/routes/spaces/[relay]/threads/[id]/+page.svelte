<script lang="ts">
  import {sortBy} from "@welshman/lib"
  import {page} from "$app/stores"
  import {repository} from "@welshman/app"
  import type {Thunk} from "@welshman/app"
  import {deriveEvents} from "@welshman/store"
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import Content from "@app/components/Content.svelte"
  import NoteCard from "@app/components/NoteCard.svelte"
  import ThreadActions from "@app/components/ThreadActions.svelte"
  import ThreadReply from "@app/components/ThreadReply.svelte"
  import {REPLY, deriveEvent, decodeRelay} from "@app/state"

  const {relay, id} = $page.params
  const url = decodeRelay(relay)
  const event = deriveEvent(id)
  const replies = deriveEvents(repository, {filters: [{kinds: [REPLY], "#E": [id]}]})

  const back = () => history.back()

  const openReply = () => {
    showReply = true
  }

  const closeReply = () => {
    showReply = false
  }

  const onReplySubmit = (thunk: Thunk) => {}

  let showReply = false
</script>

<div class="relative flex flex-col-reverse gap-3 p-2">
  <div class="absolute left-[51px] top-20 h-[calc(100%-200px)] w-[2px] bg-neutral" />
  {#if !showReply}
    <div class="flex justify-end p-2">
      <Button class="btn btn-primary" on:click={openReply}>
        <Icon icon="reply" />
        Reply to thread
      </Button>
    </div>
  {/if}
  {#each sortBy(e => -e.created_at, $replies) as reply (reply.id)}
    <NoteCard event={reply} class="card2 bg-alt z-feature w-full">
      <div class="ml-12">
        <Content event={reply} />
      </div>
      <ThreadActions event={reply} {url} />
    </NoteCard>
  {/each}
  <NoteCard event={$event} class="card2 bg-alt z-feature w-full">
    <div class="ml-12">
      <Content event={$event} />
    </div>
    <ThreadActions event={$event} {url} />
  </NoteCard>
  <Button class="mb-2 mt-5 flex items-center gap-2" on:click={back}>
    <Icon icon="alt-arrow-left" />
    Go back
  </Button>
</div>
{#if showReply}
  <ThreadReply {url} event={$event} onClose={closeReply} onSubmit={onReplySubmit} />
{/if}
