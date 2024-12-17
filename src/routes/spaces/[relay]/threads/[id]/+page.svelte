<script lang="ts">
  import {onMount} from "svelte"
  import {page} from "$app/stores"
  import {sortBy, nthEq, sleep} from "@welshman/lib"
  import {COMMENT} from "@welshman/util"
  import {repository, subscribe} from "@welshman/app"
  import {deriveEvents} from "@welshman/store"
  import Icon from "@lib/components/Icon.svelte"
  import PageBar from "@lib/components/PageBar.svelte"
  import Spinner from "@lib/components/Spinner.svelte"
  import Button from "@lib/components/Button.svelte"
  import Content from "@app/components/Content.svelte"
  import NoteCard from "@app/components/NoteCard.svelte"
  import MenuSpaceButton from "@app/components/MenuSpaceButton.svelte"
  import ThreadActions from "@app/components/ThreadActions.svelte"
  import ThreadReply from "@app/components/ThreadReply.svelte"
  import {deriveEvent, decodeRelay} from "@app/state"
  import {setChecked} from "@app/notifications"

  const {relay, id} = $page.params
  const url = decodeRelay(relay)
  const event = deriveEvent(id)
  const filters = [{kinds: [COMMENT], "#E": [id]}]
  const replies = deriveEvents(repository, {filters})

  const back = () => history.back()

  const openReply = () => {
    showReply = true
  }

  const closeReply = () => {
    showReply = false
  }

  const expand = () => {
    showAll = true
  }

  let showAll = false
  let showReply = false

  $: title = $event?.tags.find(nthEq(0, "title"))?.[1] || ""

  onMount(() => {
    const sub = subscribe({relays: [url], filters})

    return () => {
      sub.close()
      setChecked($page.url.pathname)
    }
  })
</script>

<div class="relative flex flex-col-reverse gap-3 px-2">
  <div class="absolute left-[51px] top-32 h-[calc(100%-248px)] w-[2px] bg-neutral" />
  {#if $event}
    {#if !showReply}
      <div class="flex justify-end px-2 pb-2">
        <Button class="btn btn-primary" on:click={openReply}>
          <Icon icon="reply" />
          Reply to thread
        </Button>
      </div>
    {/if}
    {#each sortBy(e => -e.created_at, $replies).slice(0, showAll ? undefined : 4) as reply (reply.id)}
      <NoteCard event={reply} class="card2 bg-alt z-feature w-full">
        <div class="col-3 ml-12">
          <Content showEntire event={reply} />
          <ThreadActions event={reply} {url} />
        </div>
      </NoteCard>
    {/each}
    {#if !showAll && $replies.length > 4}
      <div class="flex justify-center">
        <Button class="btn btn-link" on:click={expand}>
          <Icon icon="sort-vertical" />
          Show all {$replies.length} replies
        </Button>
      </div>
    {/if}
    <NoteCard event={$event} class="card2 bg-alt z-feature w-full">
      <div class="col-3 ml-12">
        <Content showEntire event={$event} quoteProps={{relays: [url]}} />
        <ThreadActions event={$event} {url} />
      </div>
    </NoteCard>
  {:else}
    {#await sleep(5000)}
      <Spinner loading>Loading thread...</Spinner>
    {:then}
      <p>Failed to load thread.</p>
    {/await}
  {/if}
  <PageBar class="mx-0">
    <div slot="icon">
      <Button class="btn btn-neutral btn-sm" on:click={back}>
        <Icon icon="alt-arrow-left" />
        Go back
      </Button>
    </div>
    <h1 slot="title" class="text-xl">{title}</h1>
    <div slot="action">
      <MenuSpaceButton {url} />
    </div>
  </PageBar>
</div>
{#if showReply}
  <ThreadReply {url} event={$event} onClose={closeReply} onSubmit={closeReply} />
{/if}
