<script lang="ts">
  import {_} from "svelte-i18n"
  import {onMount} from "svelte"
  import {uniqBy} from "@welshman/lib"
  import type {TrustedEvent} from "@welshman/util"
  import {makeFeedController} from "@welshman/app"
  import {pubkey, signer} from "@welshman/app"
  import {makeIntersectionFeed, makeKindFeed, makeAuthorFeed} from "@welshman/feeds"
  import {createScroller} from "src/util/misc"
  import {fly} from "src/util/transition"
  import Feed from "src/app/shared/Feed.svelte"
  import Tabs from "src/partials/Tabs.svelte"
  import Button from "src/partials/Button.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import VideoCard from "src/app/shared/VideoCard.svelte"
  import {getVerifiedUPlanet} from "src/util/uplanet-detect"
  import {userFollows, sortEventsDesc} from "src/engine"

  const uplanet = getVerifiedUPlanet()
  const tabs = ["🌐", "→"]

  let activeTab = "🌐"
  let viewMode: "grid" | "list" = "grid"

  // Grid mode state
  let element: HTMLElement
  let gridEvents: TrustedEvent[] = []
  let gridBuffer: TrustedEvent[] = []
  let gridExhausted = false
  let gridAbort = new AbortController()

  const setActiveTab = tab => {
    activeTab = tab
  }

  $: authors =
    !$pubkey || activeTab === "🌐"
      ? undefined
      : activeTab === "→"
        ? [...$userFollows]
        : undefined

  $: feed = authors
    ? {title: "Videos", identifier: "videos", description: "Video feed", definition: makeIntersectionFeed(makeKindFeed(21, 22), makeAuthorFeed(...authors))}
    : {title: "Videos", identifier: "videos", description: "Video feed", definition: makeIntersectionFeed(makeKindFeed(21, 22))}

  const loadGridEvents = () => {
    gridAbort.abort()
    gridAbort = new AbortController()
    gridEvents = []
    gridBuffer = []
    gridExhausted = false

    makeFeedController({
      feed: feed.definition,
      useWindowing: true,
      signal: gridAbort.signal,
      onEvent: e => {
        gridBuffer.push(e)
      },
      onExhausted: () => {
        gridExhausted = true
      },
    })
  }

  const loadMoreGrid = async () => {
    gridBuffer = uniqBy(e => e.id, sortEventsDesc(gridBuffer))
    gridEvents = [...gridEvents, ...gridBuffer.splice(0, 20)]
  }

  $: if (viewMode === "grid") {
    loadGridEvents()
  }

  onMount(() => {
    const scroller = createScroller(loadMoreGrid, {element, delay: 300, threshold: 3000})
    return () => {
      scroller.stop()
      gridAbort.abort()
    }
  })

  document.title = $_("menu.video")
</script>

<FlexColumn bind:element>
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-2">
      <i class="fa fa-video fa-lg" />
      <h2 class="staatliches text-2xl">{$_("menu.video")}</h2>
    </div>
    <div class="flex items-center gap-2">
      <div class="flex overflow-hidden rounded bg-neutral-800">
        <button
          class="px-2.5 py-1.5 text-sm transition-colors"
          class:bg-accent={viewMode === "grid"}
          class:text-white={viewMode === "grid"}
          class:text-neutral-400={viewMode !== "grid"}
          on:click={() => (viewMode = "grid")}
          title="Grid">
          <i class="fa fa-th" />
        </button>
        <button
          class="px-2.5 py-1.5 text-sm transition-colors"
          class:bg-accent={viewMode === "list"}
          class:text-white={viewMode === "list"}
          class:text-neutral-400={viewMode !== "list"}
          on:click={() => (viewMode = "list")}
          title="List">
          <i class="fa fa-list" />
        </button>
      </div>
      {#if uplanet && $signer}
        <Button
          class="btn btn-accent"
          on:click={() => window.open(`${uplanet.apiUrl}/webcam?html=1`, "_blank")}>
          <i class="fa fa-plus" /> {$_("video.publish")}
        </Button>
      {/if}
    </div>
  </div>
  {#if $pubkey}
    <Tabs {tabs} {activeTab} {setActiveTab} />
  {/if}
  {#key `${activeTab}-${viewMode}`}
    {#if viewMode === "list"}
      <Feed {feed} />
    {:else}
      <div
        class="grid gap-3"
        style="grid-template-columns: repeat(auto-fill, minmax(200px, 1fr))">
        {#each gridEvents as event (event.id)}
          <div in:fly={{y: 20}}>
            <VideoCard {event} />
          </div>
        {/each}
      </div>
      {#if !gridExhausted}
        <Spinner />
      {:else if gridEvents.length === 0}
        <p class="py-12 text-center text-neutral-400">{$_("feed.empty")}</p>
      {/if}
    {/if}
  {/key}
</FlexColumn>
