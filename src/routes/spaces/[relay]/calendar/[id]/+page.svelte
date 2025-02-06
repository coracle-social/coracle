<script lang="ts">
  import {onMount} from "svelte"
  import {page} from "$app/stores"
  import {sortBy, fromPairs, sleep} from "@welshman/lib"
  import {COMMENT, getTagValue} from "@welshman/util"
  import {
    repository,
    subscribe,
    formatTimestamp,
    LOCALE,
    secondsToDate,
    formatTimestampAsDate,
    formatTimestampAsTime,
  } from "@welshman/app"
  import {deriveEvents} from "@welshman/store"
  import Icon from "@lib/components/Icon.svelte"
  import PageBar from "@lib/components/PageBar.svelte"
  import Spinner from "@lib/components/Spinner.svelte"
  import Button from "@lib/components/Button.svelte"
  import Content from "@app/components/Content.svelte"
  import NoteCard from "@app/components/NoteCard.svelte"
  import MenuSpaceButton from "@app/components/MenuSpaceButton.svelte"
  import ProfileLink from "@app/components/ProfileLink.svelte"
  import CalendarEventActions from "@app/components/CalendarEventActions.svelte"
  import EventReply from "@app/components/EventReply.svelte"
  import {deriveEvent, decodeRelay} from "@app/state"
  import {setChecked} from "@app/notifications"

  const {relay, id} = $page.params
  const url = decodeRelay(relay)
  const event = deriveEvent(id)
  const filters = [{kinds: [COMMENT], "#E": [id]}]
  const replies = deriveEvents(repository, {filters})
  const meta = $derived(fromPairs($event.tags) as Record<string, string>)
  const end = $derived(parseInt(meta.end))
  const start = $derived(parseInt(meta.start))
  const startDate = $derived(secondsToDate(start))
  const startDateDisplay = $derived(formatTimestampAsDate(start))
  const endDateDisplay = $derived(formatTimestampAsDate(end))
  const isSingleDay = $derived(startDateDisplay === endDateDisplay)

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

  let showAll = $state(false)
  let showReply = $state(false)

  onMount(() => {
    const sub = subscribe({relays: [url], filters})

    return () => {
      sub.close()
      setChecked($page.url.pathname)
    }
  })
</script>

<div class="relative flex flex-col-reverse gap-3 px-2">
  <div class="absolute left-[51px] top-32 h-[calc(100%-248px)] w-[2px] bg-neutral"></div>
  {#if $event}
    {#if !showReply}
      <div class="flex justify-end px-2 pb-2">
        <Button class="btn btn-primary" onclick={openReply}>
          <Icon icon="reply" />
          Leave comment
        </Button>
      </div>
    {/if}
    {#each sortBy(e => -e.created_at, $replies).slice(0, showAll ? undefined : 4) as reply (reply.id)}
      <NoteCard event={reply} class="card2 bg-alt z-feature w-full">
        <div class="col-3 ml-12">
          <Content showEntire event={reply} />
          <CalendarEventActions event={reply} {url} />
        </div>
      </NoteCard>
    {/each}
    {#if !showAll && $replies.length > 4}
      <div class="flex justify-center">
        <Button class="btn btn-link" onclick={expand}>
          <Icon icon="sort-vertical" />
          Show all {$replies.length} replies
        </Button>
      </div>
    {/if}
    <div class="card2 bg-alt col-3 z-feature">
      <div class="flex items-start gap-4">
        <div
          class="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-box border border-solid border-base-content p-2">
          <span class="text-lg"
            >{Intl.DateTimeFormat(LOCALE, {month: "short"}).format(startDate)}</span>
          <span class="text-4xl"
            >{Intl.DateTimeFormat(LOCALE, {day: "numeric"}).format(startDate)}</span>
        </div>
        <div class="flex flex-grow flex-col">
          <div class="flex flex-grow justify-between gap-2">
            <p class="text-xl">{meta.title || meta.name}</p>
            <div class="flex items-center gap-2 text-sm">
              <Icon icon="clock-circle" size={4} />
              {formatTimestampAsTime(start)} — {isSingleDay
                ? formatTimestampAsTime(end)
                : formatTimestamp(end)}
            </div>
          </div>
          <div class="flex items-center gap-2 text-sm opacity-75">
            <span>
              Posted by <ProfileLink pubkey={$event.pubkey} />
            </span>
            {#if meta.location}
              <span>•</span>
              <span class="flex items-center gap-1">
                <Icon icon="map-point" size={4} />
                {meta.location}
              </span>
            {/if}
          </div>
          <div class="flex py-2 opacity-50">
            <div class="h-px flex-grow bg-base-content opacity-25"></div>
          </div>
          <Content showEntire event={$event} quoteProps={{relays: [url]}} />
        </div>
      </div>
      <div class="flex w-full flex-col justify-end sm:flex-row">
        <CalendarEventActions {url} event={$event} />
      </div>
    </div>
  {:else}
    {#await sleep(5000)}
      <Spinner loading>Loading comments...</Spinner>
    {:then}
      <p>Failed to load comments.</p>
    {/await}
  {/if}
  <PageBar class="mx-0">
    {#snippet icon()}
      <div>
        <Button class="btn btn-neutral btn-sm" onclick={back}>
          <Icon icon="alt-arrow-left" />
          Go back
        </Button>
      </div>
    {/snippet}
    {#snippet title()}
      <h1 class="text-xl">{getTagValue("title", $event?.tags || []) || ""}</h1>
    {/snippet}
    {#snippet action()}
      <MenuSpaceButton {url} />
    {/snippet}
  </PageBar>
</div>
{#if showReply}
  <EventReply {url} event={$event} onClose={closeReply} onSubmit={closeReply} />
{/if}
