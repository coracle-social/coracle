<script lang="ts">
  import {onMount} from "svelte"
  import {sortBy, displayUrl, sleep} from "@welshman/lib"
  import {page} from "$app/stores"
  import {repository, subscribe} from "@welshman/app"
  import {deriveEvents} from "@welshman/store"
  import Icon from "@lib/components/Icon.svelte"
  import Link from "@lib/components/Link.svelte"
  import Spinner from "@lib/components/Spinner.svelte"
  import Button from "@lib/components/Button.svelte"
  import Content from "@app/components/Content.svelte"
  import NoteCard from "@app/components/NoteCard.svelte"
  import ThreadActions from "@app/components/ThreadActions.svelte"
  import ThreadReply from "@app/components/ThreadReply.svelte"
  import {REPLY, deriveEvent, decodeRelay} from "@app/state"
  import {makeSpacePath} from "@app/routes"

  const {relay, id} = $page.params
  const url = decodeRelay(relay)
  const event = deriveEvent(id)
  const filters = [{kinds: [REPLY], "#E": [id]}]
  const replies = deriveEvents(repository, {filters})

  const back = () => history.back()

  const openReply = () => {
    showReply = true
  }

  const closeReply = () => {
    showReply = false
  }

  let showReply = false

  onMount(() => {
    const sub = subscribe({filters, relays: [url]})

    return () => sub.close()
  })
</script>

<div class="relative flex flex-col-reverse gap-3 p-2">
  <div class="absolute left-[51px] top-20 h-[calc(100%-200px)] w-[2px] bg-neutral" />
  {#if $event}
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
  {:else}
    {#await sleep(5000)}
      <Spinner loading>Loading thread...</Spinner>
    {:then}
      <p>Failed to load thread.</p>
    {/await}
  {/if}
  <div class="flex items-center justify-between">
    <Button class="mb-2 mt-5 flex items-center gap-2" on:click={back}>
      <Icon icon="alt-arrow-left" />
      Go back
    </Button>
    <Link href={makeSpacePath(url)}>
      @<span class="text-primary">{displayUrl(url)}</span>
    </Link>
  </div>
</div>
{#if showReply}
  <ThreadReply {url} event={$event} onClose={closeReply} onSubmit={closeReply} />
{/if}
