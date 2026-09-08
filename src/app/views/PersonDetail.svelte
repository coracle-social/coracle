<script lang="ts">
  import {first, max, noop, stripProtocol} from "@welshman/lib"
  import {
    PINS,
    REACTION,
    PROFILE,
    RELAYS,
    MESSAGING_RELAYS,
    FOLLOWS,
    indexers,
    isShareableRelayUrl,
    getIdFilters,
    outbox,
  } from "@welshman/util"
  import {feedFromFilter} from "@welshman/feeds"
  import {
    FollowLists,
    Handles,
    PinLists,
    Profiles,
    RelayLists,
    Wot,
    WotScope,
    Zappers,
  } from "@welshman/app"
  import {
    deriveEvents,
    fromApp,
    getWriteRelays,
    profiles,
    resolveRelays,
    session,
  } from "src/engine/core"
  import {ensureProto, toTitle} from "src/util/misc"
  import {makeZapSplit} from "src/util/nostr"
  import AltColor from "src/partials/AltColor.svelte"
  import Tabs from "src/partials/Tabs.svelte"
  import Link from "src/partials/Link.svelte"
  import Button from "src/partials/Button.svelte"
  import CopyValueSimple from "src/partials/CopyValueSimple.svelte"
  import Content from "src/partials/Content.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import Popover from "src/partials/Popover.svelte"
  import Feed from "src/app/shared/Feed.svelte"
  import PersonActions from "src/app/shared/PersonActions.svelte"
  import PersonRelays from "src/app/shared/PersonRelays.svelte"
  import PersonHandle from "src/app/shared/PersonHandle.svelte"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"
  import PersonAbout from "src/app/shared/PersonAbout.svelte"
  import PersonCollections from "src/app/shared/PersonCollections.svelte"
  import PersonFollowers from "src/app/views/PersonFollowers.svelte"
  import PersonFollows from "src/app/views/PersonFollows.svelte"
  import {makeFeed} from "src/domain"
  import {myLoad, userMutedPubkeys, userFollows, follow, unfollow} from "src/engine"
  import {router, zap} from "src/app/util"
  import * as nip19 from "nostr-tools/nip19"
  import {tweened} from "svelte/motion"
  import {derived} from "svelte/store"
  import WotScore from "src/partials/WotScore.svelte"
  import FeedItem from "../shared/FeedItem.svelte"
  import {fly} from "svelte/transition"

  export let pubkey
  export let relays = []

  const handle = fromApp($app => $app.use(Handles).forPubkey(pubkey).$)
  const profile = fromApp($app => $app.use(Profiles).one(pubkey, relays))
  const zapper = fromApp($app => $app.use(Zappers).forPubkey(pubkey, relays).$)
  const relayList = fromApp($app => $app.use(RelayLists).one(pubkey, relays))
  const pinList = fromApp($app => $app.use(PinLists).one(pubkey))
  const notesFeed = makeFeed({definition: feedFromFilter({authors: [pubkey]})})
  const likesFeed = makeFeed({definition: feedFromFilter({kinds: [REACTION], authors: [pubkey]})})
  const interpolate = (a, b) => t => a + Math.round((b - a) * t)
  const followsCount = tweened(0, {interpolate, duration: 1000})
  const followersCount = tweened(0, {interpolate, duration: 1300})
  const follows = fromApp($app => $app.use(FollowLists).one(pubkey))
  const following = derived(userFollows, $m => $m.has(pubkey))
  const wotScore = fromApp($app => $app.use(Wot).score(pubkey, WotScope.Follows).$)
  const maxWot = fromApp($app =>
    derived($app.use(Wot).scores(WotScope.Follows).$, $scores => max(Array.from($scores.values()))),
  )
  const followers = fromApp($app => $app.use(Wot).followers(pubkey, WotScope.Global).$)
  const npub = nip19.npubEncode(pubkey)
  const profileDisplay = fromApp($app => $app.use(Profiles).display(pubkey).$)
  const tabs = ["notes", "likes", "collections", "relays", "following", "followers"]

  const startZap = () =>
    zap({
      splits: [makeZapSplit(pubkey, first(getWriteRelays(pubkey)) || "")],
    })

  const setActiveTab = tab => {
    activeTab = tab
  }

  const toggleFollowing = async () => {
    togglingFollowing = $following

    try {
      if ($following) {
        await unfollow(pubkey)
      } else {
        await follow(pubkey)
      }
    } finally {
      togglingFollowing = undefined
    }
  }

  let activeTab = "notes"
  let togglingFollowing: boolean = undefined

  $: followersCount.set($followers.length)
  $: followsCount.set(($follows?.pubkeys() || []).length)
  $: pinnedIds = $pinList?.ids() || []
  $: pinnedEvents = deriveEvents(getIdFilters(pinnedIds))
  $: zapDisplay = $profile?.values.lud16 || $profile?.values.lud06

  $: {
    const filters = getIdFilters(pinnedIds)

    resolveRelays([outbox(pubkey)])
      .then(urls => myLoad({relays: urls, filters}))
      .catch(noop)
  }

  // Force load profile when the user visits the detail page
  resolveRelays([indexers(), outbox(pubkey)])
    .then(urls =>
      myLoad({
        relays: urls,
        filters: [{kinds: [PINS, PROFILE, RELAYS, MESSAGING_RELAYS, FOLLOWS], authors: [pubkey]}],
      }),
    )
    .catch(noop)

  document.title = $profiles.display(pubkey).get()
</script>

<div>
  <AltColor
    background
    class="relative flex flex-col gap-8 p-6 text-neutral-100 sm:flex-row sm:gap-4">
    <div class="flex flex-col items-center gap-4">
      <PersonCircle {pubkey} class="mt-1 h-32 w-32" />
      {#if pubkey === $session?.pubkey}
        <Link
          class="btn w-full !bg-neutral-800 dark:!bg-white"
          href={router.at("settings/profile").toString()}>
          Edit
        </Link>
      {:else if $session}
        <Button
          class="btn w-full {$following ? 'btn-low' : 'btn-accent'}"
          loading={togglingFollowing === $following}
          on:click={toggleFollowing}>{$following ? "Unfollow" : "Follow"}</Button>
        <Link
          class="btn w-full {$following ? '' : 'btn-low'}"
          href={router.at("channels").of([$session.pubkey, pubkey]).toString()}>
          Message
        </Link>
      {/if}
    </div>
    <div class="flex min-w-0 flex-grow flex-col gap-4">
      <div class="flex flex-col">
        <div class="flex w-full items-center justify-between gap-4">
          <div>
            <div class="flex max-w-[80%] items-center gap-2 text-xl">
              <div class="overflow-ellipsis whitespace-nowrap">{$profileDisplay}</div>
              <div on:click|stopPropagation>
                <Popover triggerType="mouseenter" opts={{hideOnClick: true}}>
                  <div slot="trigger">
                    <WotScore
                      class="h-6 w-6"
                      score={$wotScore}
                      max={$maxWot}
                      accent={$following || pubkey === $session?.pubkey} />
                  </div>
                  <Link
                    modal
                    slot="tooltip"
                    class="flex items-center gap-1"
                    href="/help/web-of-trust">
                    <i class="fa fa-info-circle" />
                    WoT Score: {$wotScore}
                  </Link>
                </Popover>
              </div>
            </div>
            <div class="mt-4 break-all opacity-75">
              <span>{npub}</span>
              <CopyValueSimple class="!inline-flex pl-1" value={npub} label="Npub" />
            </div>
          </div>
          <div class="absolute right-4 top-4">
            <PersonActions {pubkey} />
          </div>
        </div>
      </div>
      <div class="flex max-w-[80%] flex-col gap-3">
        {#if $handle}
          <div class="flex items-center gap-2">
            <i class="fa fa-at w-4 text-accent" />
            <PersonHandle {pubkey} />
          </div>
        {/if}
        {#if $zapper && zapDisplay}
          <Button class="flex items-center gap-2" on:click={startZap}>
            <i class="fa fa-bolt w-4 text-accent" />
            <div class="overflow-hidden overflow-ellipsis">
              {zapDisplay}
            </div>
          </Button>
        {/if}
        {#if $profile?.website()}
          <Link
            external
            class="col-span-2 flex items-center gap-2"
            href={ensureProto($profile.website())}>
            <i class="fa fa-link w-4 text-accent" />
            {stripProtocol($profile.website())}
          </Link>
        {/if}
      </div>
      <div class="flex flex-grow flex-col gap-4">
        <PersonAbout class="font-thin opacity-75" {pubkey} />
      </div>
    </div>
  </AltColor>
  <div class="bg-tinted-800-d pt-3">
    <Tabs {tabs} {activeTab} {setActiveTab}>
      <div slot="tab" let:tab class="flex gap-2 px-2">
        {toTitle(tab)}
        {#if tab === "following" && $followsCount > 0}
          <div class="h-6 rounded-full bg-neutral-700 px-2">
            {$followsCount}
          </div>
        {:else if tab === "followers" && $followersCount > 0}
          <div class="h-6 rounded-full bg-neutral-700 px-2">
            {$followersCount}+
          </div>
        {/if}
      </div>
    </Tabs>
  </div>
</div>
{#if $userMutedPubkeys.has(pubkey)}
  <Content size="lg" class="text-center">You have muted this person.</Content>
{:else if activeTab === "notes"}
  {#each $pinnedEvents as event (event.id)}
    <div transition:fly={{y: 150}}>
      <FeedItem note={event} pinned />
    </div>
  {/each}
  <Feed shouldSort maxDepth={1} feed={notesFeed} />
{:else if activeTab === "likes"}
  <Feed feed={likesFeed} />
{:else if activeTab === "collections"}
  <PersonCollections {pubkey} />
{:else if activeTab === "relays"}
  {#if $relayList}
    <PersonRelays urls={$relayList.urls().filter(isShareableRelayUrl)} />
  {:else}
    <Spinner />
  {/if}
{:else if activeTab.includes("following")}
  <PersonFollows {pubkey} />
{:else if activeTab.includes("followers")}
  <PersonFollowers {pubkey} />
{/if}
