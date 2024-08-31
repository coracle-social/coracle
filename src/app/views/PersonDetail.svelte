<script lang="ts">
  import {identity} from "ramda"
  import {stripProtocol} from "@welshman/lib"
  import {REACTION} from "@welshman/util"
  import {feedFromFilter} from "@welshman/feeds"
  import {ensureProto} from "src/util/misc"
  import {themeBackgroundGradient} from "src/partials/state"
  import Tabs from "src/partials/Tabs.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Content from "src/partials/Content.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import Feed from "src/app/shared/Feed.svelte"
  import PersonName from "src/app/shared/PersonName.svelte"
  import PersonActions from "src/app/shared/PersonActions.svelte"
  import PersonRelays from "src/app/shared/PersonRelays.svelte"
  import PersonHandle from "src/app/shared/PersonHandle.svelte"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"
  import PersonAbout from "src/app/shared/PersonAbout.svelte"
  import PersonStats from "src/app/shared/PersonStats.svelte"
  import PersonCollections from "src/app/shared/PersonCollections.svelte"
  import {makeFeed} from "src/domain"
  import {
    makeZapSplit,
    userMutes,
    deriveProfile,
    displayProfileByPubkey,
    loadPubkeys,
    imgproxy,
    deriveZapper,
    getPubkeyRelayPolicies,
  } from "src/engine"
  import {router} from "src/app/util"

  export let pubkey
  export let relays = []

  const zapper = deriveZapper(pubkey)
  const profile = deriveProfile(pubkey)
  const tabs = ["notes", "likes", "collections", "relays"].filter(identity)
  const notesFeed = makeFeed({definition: feedFromFilter({authors: [pubkey]})})
  const likesFeed = makeFeed({definition: feedFromFilter({kinds: [REACTION], authors: [pubkey]})})

  let activeTab = "notes"

  $: ({rgb, rgba} = $themeBackgroundGradient)
  $: relayPolicies = getPubkeyRelayPolicies(pubkey)
  $: banner = imgproxy($profile?.banner, {w: window.innerWidth})
  $: zapDisplay = $profile?.lud16 || $profile?.lud06
  $: zapLink = router
    .at("zap")
    .qp({splits: [makeZapSplit(pubkey)]})
    .toString()

  loadPubkeys([pubkey], {force: true, relays})

  document.title = displayProfileByPubkey(pubkey)

  const setActiveTab = tab => {
    activeTab = tab
  }
</script>

<div
  class="absolute left-0 -mt-4 h-96 w-full"
  style={`z-index: -1;
       background-size: cover;
       background-image: linear-gradient(to bottom, ${rgba}, ${rgba}, ${rgb}), url('${banner}')`} />

<div class="flex gap-4 text-neutral-100">
  <PersonCircle {pubkey} class="mt-1 h-12 w-12 sm:h-32 sm:w-32" />
  <div class="flex min-w-0 flex-grow flex-col gap-4">
    <div class="flex flex-col">
      <div class="flex items-center justify-between gap-4">
        <PersonName class="text-2xl" {pubkey} displayNpubCopyButton />
        <div class="hidden xs:block">
          <PersonActions {pubkey} />
        </div>
      </div>
      <PersonHandle {pubkey} />
    </div>
    {#if $profile?.website}
      <Anchor external class="flex items-center gap-2 text-sm" href={ensureProto($profile.website)}>
        <i class="fa fa-link text-accent" />
        {stripProtocol($profile.website)}
      </Anchor>
    {/if}
    {#if $zapper && zapDisplay}
      <Anchor modal class="flex items-center gap-2 text-sm" href={zapLink}>
        <i class="fa fa-bolt text-accent" />
        {zapDisplay}
      </Anchor>
    {/if}
    <div class="-ml-16 flex flex-grow flex-col gap-4 xs:ml-0">
      <PersonAbout {pubkey} />
      <div class="flex justify-between">
        <PersonStats {pubkey} />
        <div class="block xs:hidden">
          <PersonActions {pubkey} />
        </div>
      </div>
    </div>
  </div>
</div>

<Tabs {tabs} {activeTab} {setActiveTab} />

{#if $userMutes.has(pubkey)}
  <Content size="lg" class="text-center">You have muted this person.</Content>
{:else if activeTab === "notes"}
  <Feed showGroup forcePlatform={false} feed={notesFeed} />
{:else if activeTab === "likes"}
  <Feed showGroup forcePlatform={false} feed={likesFeed} />
{:else if activeTab === "collections"}
  <PersonCollections {pubkey} />
{:else if activeTab === "relays"}
  {#if relayPolicies.length > 0}
    <PersonRelays urls={relayPolicies.map(p => p.url)} />
  {:else}
    <Spinner />
  {/if}
{/if}
