<script lang="ts">
  import {onMount} from "svelte"
  import {derived} from "svelte/store"
  import {createScroller} from "@lib/html"
  import {sortBy, sleep, ago, DAY, HOUR, pushToMapKey} from "@welshman/lib"
  import {
    getListTags,
    getPubkeyTagValues,
    getAncestorTagValues,
    NOTE,
    REACTION,
  } from "@welshman/util"
  import type {TrustedEvent} from "@welshman/util"
  import {deriveEvents} from "@welshman/store"
  import {repository, userFollows, load} from "@welshman/app"
  import Link from "@lib/components/Link.svelte"
  import Icon from "@lib/components/Icon.svelte"
  import Spinner from "@lib/components/Spinner.svelte"
  import NoteCard from "@app/components/NoteCard.svelte"
  import Content from "@app/components/Content.svelte"

  let element: Element
  let events: TrustedEvent[] = []

  const since = ago(DAY)
  const loading = sleep(3000)
  const authors = getPubkeyTagValues(getListTags($userFollows))
  const notesFilter = {kinds: [NOTE], authors, since}
  const notes = deriveEvents(repository, {filters: [notesFilter]})
  const reactionsFilter = {kinds: [REACTION], "#p": authors, since}
  const reactions = deriveEvents(repository, {filters: [reactionsFilter]})
  const reactionsByParent = derived(reactions, $reactions => {
    const $reactionsByParent = new Map<string, TrustedEvent[]>()

    for (const event of $reactions) {
      const [parentId] = getAncestorTagValues(event.tags).replies

      if (parentId) {
        pushToMapKey($reactionsByParent, parentId, event)
      }
    }

    return $reactionsByParent
  })

  const isLike = (e: TrustedEvent) => e.kind === REACTION && ["+", ""].includes(e.content)

  const scoreEvent = (e: TrustedEvent) => {
    const thisReactions = $reactionsByParent.get(e.id) || []
    const thisLikes = thisReactions.filter(r => isLike(r))
    const recency = Math.max(1, e.created_at - since) / HOUR
    const score = Math.max(1, thisReactions.length) * Math.max(1, thisLikes.length) * recency

    return -score
  }

  onMount(() => {
    load({filters: [notesFilter, reactionsFilter], timeout: 30_000})

    const scroller = createScroller({
      element,
      onScroll: () => {
        const seen = new Set(events.map(e => e.id))
        const eligible = sortBy(
          scoreEvent,
          $notes.filter(e => !seen.has(e.id) && getAncestorTagValues(e.tags).replies.length === 0),
        )

        events = [...events, ...eligible.slice(0, 10)]
      },
    })

    return () => scroller.stop()
  })
</script>

<div class="content column gap-4" bind:this={element}>
  {#await loading}
    <div class="center my-20">
      <Spinner loading>Loading posts from people you follow...</Spinner>
    </div>
  {:then}
    <div class="flex flex-col gap-2">
      {#each events as event (event.id)}
        <NoteCard {event} class="card2 bg-alt w-full">
          <div class="ml-12">
            <Content {event} />
          </div>
        </NoteCard>
      {:else}
        <div class="py-20 max-w-sm col-4 items-center m-auto text-center">
          <p>No activity found! Try following a few more people.</p>
          <Link class="btn btn-primary" href="/home/people">
            <Icon icon="user-heart" />
            Browse Profiles
          </Link>
        </div>
      {/each}
    </div>
  {/await}
</div>
