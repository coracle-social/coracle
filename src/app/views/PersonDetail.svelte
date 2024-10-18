<script lang="ts">
  import cx from 'classnames'
  import {stripProtocol, identity} from "@welshman/lib"
  import {
    REACTION,
    PROFILE,
    RELAYS,
    INBOX_RELAYS,
    FOLLOWS,
    isShareableRelayUrl,
    getPubkeyTagValues,
    getListTags,
  } from "@welshman/util"
  import {feedFromFilter} from "@welshman/feeds"
  import {
    deriveProfile,
    deriveHandleForPubkey,
    deriveZapperForPubkey,
    displayProfileByPubkey,
    getRelayUrls,
    deriveRelaySelections,
    tagZapSplit,
    deriveProfileDisplay,
    deriveFollows,
    getFollowers,
    getUserWotScore,
    maxWot,
    session,
    tagPubkey,
  } from "@welshman/app"
  import {ensureProto} from "src/util/misc"
  import AltColor from "src/partials/AltColor.svelte"
  import {themeBackgroundGradient} from "src/partials/state"
  import Tabs from "src/partials/Tabs.svelte"
  import Anchor from "src/partials/Anchor.svelte"
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
  import {load, userMutes, imgproxy, userFollows, follow, unfollow} from "src/engine"
  import {router} from "src/app/util"
  import {nip19} from "nostr-tools"
  import {tweened} from "svelte/motion"
  import {derived} from "svelte/store"
  import {toTitle} from "hurdak"
  import WotScore from "src/partials/WotScore.svelte"

  export let pubkey
  export let relays = []

  const handle = deriveHandleForPubkey(pubkey)
  const profile = deriveProfile(pubkey, {relays})
  const zapper = deriveZapperForPubkey(pubkey, {relays})
  const relaySelections = deriveRelaySelections(pubkey, {relays})

  const notesFeed = makeFeed({definition: feedFromFilter({authors: [pubkey]})})
  const likesFeed = makeFeed({definition: feedFromFilter({kinds: [REACTION], authors: [pubkey]})})

  const interpolate = (a, b) => t => a + Math.round((b - a) * t)
  const followsCount = tweened(0, {interpolate, duration: 1000})
  const followersCount = tweened(0, {interpolate, duration: 1300})
  const follows = deriveFollows(pubkey)
  const following = derived(userFollows, $m => $m.has(pubkey))
  const wotScore = getUserWotScore(pubkey)

  let activeTab = "notes"

  followersCount.set(getFollowers(pubkey).length)

  $: pubkeys = getPubkeyTagValues(getListTags($follows))

  $: {
    followsCount.set(pubkeys.length)
  }

  $: ({rgb, rgba} = $themeBackgroundGradient)
  $: banner = imgproxy($profile?.banner, {w: window.innerWidth})
  $: zapDisplay = $profile?.lud16 || $profile?.lud06
  $: zapLink = router
    .at("zap")
    .qp({splits: [tagZapSplit(pubkey)]})
    .toString()

  $: tabs = ["notes", "likes", "collections", "relays", "following", "followers"].filter(identity)

  document.title = displayProfileByPubkey(pubkey)

  // Force load profile when the user visits the detail page
  load({filters: [{kinds: [PROFILE, RELAYS, INBOX_RELAYS, FOLLOWS], authors: [pubkey]}]})

  const npub = nip19.npubEncode(pubkey)
  const profileDisplay = deriveProfileDisplay(pubkey)

  const setActiveTab = tab => {
    activeTab = tab
  }
</script>

<div
  class="absolute left-0 -mt-4 h-96 w-full"
  style={`z-index: -1;
       background-size: cover;
       background-image: linear-gradient(to bottom, ${rgba}, ${rgba}, ${rgb}), url('${banner}')`} />

<div>
  <AltColor background class="relative flex gap-4 p-6 text-neutral-100">
    <div>
      <PersonCircle {pubkey} class="mt-1 h-12 w-12 sm:h-32 sm:w-32" />
      {#if pubkey === $session?.pubkey}
        <Anchor
          button
          class="mt-4 !bg-neutral-800 dark:!bg-white"
          on:click={router.at("/settings/profile").open}>Edit</Anchor>
      {:else}
        <Anchor
          button
          accent={!$following}
          low={$following}
          class="mt-4"
          on:click={() => ($following ? unfollow(pubkey) : follow(tagPubkey(pubkey)))}
          >{$following ? "Unfollow" : "Follow"}</Anchor>
        <Anchor
          button
          low
          class="mt-4 border-none bg-tinted-800-d"
          on:click={router.at("channels").of([$session.pubkey, pubkey]).push}>Message</Anchor>
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
                      score={wotScore}
                      max={$maxWot}
                      accent={$following || pubkey === $session?.pubkey} />
                  </div>
                  <Anchor
                    modal
                    slot="tooltip"
                    class="flex items-center gap-1"
                    href="/help/web-of-trust">
                    <i class="fa fa-info-circle" />
                    WoT Score: {wotScore}
                  </Anchor>
                </Popover>
              </div>
            </div>
            <div class="mt-4 break-all opacity-75">
              <span>{npub}</span>
              <CopyValueSimple class="!inline-flex pl-1" value={npub} label="Npub" />
            </div>
          </div>
          <div class="absolute right-4 top-4 hidden xs:block">
            <PersonActions {pubkey} />
          </div>
        </div>
      </div>
      <div class="flex flex-col sm:flex-row max-w-[80%] gap-4 justify-between">
        {#if $handle}
          <div class="flex items-center gap-2 text-accent">
            <i class="fa fa-at" />
            <PersonHandle {pubkey} />
          </div>
        {/if}
        {#if $zapper && zapDisplay}
          <Anchor modal class="flex items-center gap-2 opacity-75" href={zapLink}>
            <i class="fa fa-bolt" />
            {zapDisplay}
          </Anchor>
        {/if}
        {#if $profile?.website}
          <Anchor
            external
            class="flex items-center gap-2 overflow-hidden overflow-ellipsis whitespace-nowrap"
            href={ensureProto($profile.website)}>
            <i class="fa fa-link text-accent" />
            {stripProtocol($profile.website)}
          </Anchor>
        {/if}
      </div>
      <div class="-ml-16 flex flex-grow flex-col gap-4 xs:ml-0">
        <PersonAbout class="font-thin opacity-75" {pubkey} />
      </div>
    </div>
  </AltColor>
  <div class="bg-tinted-800-d pt-3">
    <Tabs {tabs} {activeTab} {setActiveTab}>
      <div slot="tab" let:tab class="flex gap-2 px-2">
        {toTitle(tab)}
        {#if tab == "following" && $followsCount > 0}
          <div class="h-6 rounded-full bg-neutral-700 px-2">
            {$followsCount}
          </div>
        {:else if tab == "followers" && $followersCount > 0}
          <div class="h-6 rounded-full bg-neutral-700 px-2">
            {$followersCount}
          </div>
        {/if}
      </div>
    </Tabs>
  </div>
</div>
{#if $userMutes.has(pubkey)}
  <Content size="lg" class="text-center">You have muted this person.</Content>
{:else if activeTab === "notes"}
  <Feed showGroup forcePlatform={false} feed={notesFeed} />
{:else if activeTab === "likes"}
  <Feed showGroup forcePlatform={false} feed={likesFeed} />
{:else if activeTab === "collections"}
  <PersonCollections {pubkey} />
{:else if activeTab === "relays"}
  {#if $relaySelections}
    <PersonRelays urls={getRelayUrls($relaySelections).filter(isShareableRelayUrl)} />
  {:else}
    <Spinner />
  {/if}
{:else if activeTab.includes("following")}
  <PersonFollows {pubkey} />
{:else if activeTab.includes("followers")}
  <PersonFollowers {pubkey} />
{/if}
