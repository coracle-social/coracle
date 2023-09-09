<script lang="ts">
  import {identity, defaultTo} from "ramda"
  import {info} from "src/util/logger"
  import {toHex} from "src/util/nostr"
  import {getThemeBackgroundGradient} from "src/partials/state"
  import Tabs from "src/partials/Tabs.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Content from "src/partials/Content.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import PersonActions from "src/app/shared/PersonActions.svelte"
  import PersonNotes from "src/app/shared/PersonNotes.svelte"
  import PersonLikes from "src/app/shared/PersonLikes.svelte"
  import PersonRelays from "src/app/shared/PersonRelays.svelte"
  import PersonHandle from "src/app/shared/PersonHandle.svelte"
  import PersonName from "src/app/shared/PersonName.svelte"
  import {loadPubkeys} from "src/engine2"
  import {Env, Settings, Directory, Nip65} from "src/app/engine"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"
  import PersonAbout from "src/app/shared/PersonAbout.svelte"
  import PersonStats from "src/app/shared/PersonStats.svelte"

  export let npub
  export let relays = []

  const tabs = ["notes", "likes", Env.FORCE_RELAYS.length === 0 && "relays"].filter(identity)
  const pubkey = toHex(npub)
  const relayLimit = Settings.getSetting("relay_limit")
  const profile = Directory.profiles.key(pubkey).derived(defaultTo({pubkey}))
  const {rgb, rgba} = getThemeBackgroundGradient()

  let activeTab = "notes"
  let loading = true

  $: ownRelays = Nip65.getPubkeyRelays(pubkey)
  $: mergedRelays = Nip65.mergeHints(relayLimit, [
    relays,
    Nip65.getPubkeyHints(relayLimit, pubkey, "write"),
  ])
  $: banner = Settings.imgproxy($profile.banner, {w: window.innerWidth})

  info("Person", npub, $profile)

  loadPubkeys([pubkey], {force: true})

  document.title = Directory.displayProfile($profile)

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
