<script lang="ts">
  import {identity} from "ramda"
  import {info} from "src/util/logger"
  import {toHex} from "src/util/nostr"
  import {stripProto, ensureProto} from "src/util/misc"
  import {getThemeBackgroundGradient} from "src/partials/state"
  import Tabs from "src/partials/Tabs.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Content from "src/partials/Content.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import PersonName from "src/app/shared/PersonName.svelte"
  import PersonActions from "src/app/shared/PersonActions.svelte"
  import PersonNotes from "src/app/shared/PersonNotes.svelte"
  import PersonLikes from "src/app/shared/PersonLikes.svelte"
  import PersonRelays from "src/app/shared/PersonRelays.svelte"
  import PersonHandle from "src/app/shared/PersonHandle.svelte"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"
  import PersonAbout from "src/app/shared/PersonAbout.svelte"
  import PersonStats from "src/app/shared/PersonStats.svelte"
  import {
    env,
    derivePerson,
    displayPerson,
    loadPubkeys,
    imgproxy,
    getPubkeyRelays,
    mergeHints,
    getPubkeyHints,
  } from "src/engine"

  export let npub
  export let relays = []

  const tabs = ["notes", "likes", $env.FORCE_RELAYS.length === 0 && "relays"].filter(identity)
  const pubkey = toHex(npub)
  const person = derivePerson(pubkey)
  const {rgb, rgba} = getThemeBackgroundGradient()

  let activeTab = "notes"
  let loading = true

  $: ownRelays = getPubkeyRelays(pubkey)
  $: mergedRelays = mergeHints([relays, getPubkeyHints(pubkey, "write")])
  $: banner = imgproxy($person.profile?.banner, {w: window.innerWidth})

  info("Person", npub, $person)

  loadPubkeys([pubkey], {force: true})

  document.title = displayPerson($person)

  const setActiveTab = tab => {
    activeTab = tab
  }
</script>

<div
  class="absolute left-0 h-64 w-full"
  style={`z-index: -1;
         background-size: cover;
         background-image: linear-gradient(to bottom, ${rgba}, ${rgb}), url('${banner}')`} />

<Content>
  <div class="flex gap-4 text-gray-1">
    <PersonCircle {pubkey} size={12} class="mt-1 sm:h-32 sm:w-32" />
    <div class="flex min-w-0 flex-grow flex-col gap-4">
      <Anchor class="flex flex-col" href={`/${npub}`}>
        <div class="flex items-center justify-between gap-4">
          <PersonName class="text-2xl" {pubkey} />
          <div class="hidden xs:block">
            <PersonActions {pubkey} />
          </div>
        </div>
        <PersonHandle {pubkey} />
      </Anchor>
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

  {#if activeTab === "notes"}
    <PersonNotes {pubkey} relays={mergedRelays} />
  {:else if activeTab === "likes"}
    <PersonLikes {pubkey} relays={mergedRelays} />
  {:else if activeTab === "relays"}
    {#if ownRelays.length > 0}
      <PersonRelays relays={ownRelays} />
    {:else if loading}
      <Spinner />
    {:else}
      <Content size="lg" class="text-center">Unable to show network for this person.</Content>
    {/if}
  {/if}
</Content>
