<script lang="ts">
  import {identity} from "ramda"
  import {stripProto} from "paravel"
  import {info} from "src/util/logger"
  import {ensureProto} from "src/util/misc"
  import {noteKinds} from "src/util/nostr"
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
  import {
    env,
    mutes,
    derivePerson,
    displayPerson,
    loadPubkeys,
    imgproxy,
    getPubkeyRelays,
  } from "src/engine"

  export let npub
  export let pubkey
  export let relays = []
  export let filter = {kinds: noteKinds, authors: [pubkey]}

  const tabs = ["notes", "likes", $env.FORCE_RELAYS.length === 0 && "relays"].filter(identity)
  const person = derivePerson(pubkey)

  let activeTab = "notes"

  $: ownRelays = getPubkeyRelays(pubkey)
  $: banner = imgproxy($person.profile?.banner, {w: window.innerWidth})
  $: ({rgb, rgba} = $themeBackgroundGradient)

  info("Person", npub, pubkey, $person)

  loadPubkeys([pubkey], {force: true, relays})

  document.title = displayPerson($person)

  const setActiveTab = tab => {
    activeTab = tab
  }
</script>

<div
  class="absolute left-0 -mt-4 h-96 w-full"
  style={`z-index: -1;
       background-size: cover;
       background-image: linear-gradient(to bottom, ${rgba}, ${rgba}, ${rgb}), url('${banner}')`} />

<div class="flex gap-4 text-lightest">
  <PersonCircle {pubkey} class="mt-1 h-12 w-12 sm:h-32 sm:w-32" />
  <div class="flex min-w-0 flex-grow flex-col gap-4">
    <div class="flex flex-col">
      <div class="flex items-center justify-between gap-4">
        <PersonName class="text-2xl" {pubkey} />
        <div class="hidden xs:block">
          <PersonActions {pubkey} />
        </div>
      </div>
      <PersonHandle {pubkey} />
    </div>
    {#if $person.profile?.website}
      <Anchor
        external
        class="flex items-center gap-2 text-sm"
        href={ensureProto($person.profile.website)}>
        <i class="fa fa-link text-accent" />
        {stripProto($person.profile.website)}
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

{#if $mutes.has(pubkey)}
  <Content size="lg" class="text-center">You have muted this person.</Content>
{:else if activeTab === "notes"}
  <Feed showGroup {filter} />
{:else if activeTab === "likes"}
  <Feed showGroup hideControls filter={{kinds: [7], authors: [pubkey]}} />
{:else if activeTab === "relays"}
  {#if ownRelays.length > 0}
    <PersonRelays relays={ownRelays} />
  {:else}
    <Spinner />
  {/if}
{/if}
