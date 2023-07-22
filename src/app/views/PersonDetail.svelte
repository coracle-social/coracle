<script lang="ts">
  import {identity, defaultTo} from "ramda"
  import {navigate} from "svelte-routing"
  import {log} from "src/util/logger"
  import {parseHex} from "src/util/html"
  import {toHex} from "src/util/nostr"
  import {theme, getThemeColor} from "src/partials/state"
  import Tabs from "src/partials/Tabs.svelte"
  import Content from "src/partials/Content.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import PersonActions from "src/app/shared/PersonActions.svelte"
  import PersonNotes from "src/app/shared/PersonNotes.svelte"
  import PersonLikes from "src/app/shared/PersonLikes.svelte"
  import PersonRelays from "src/app/shared/PersonRelays.svelte"
  import {Env, PubkeyLoader, Nip05, Directory, Nip65} from "src/app/engine"
  import {routes} from "src/app/state"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"
  import PersonAbout from "src/app/shared/PersonAbout.svelte"
  import PersonStats from "src/app/shared/PersonStats.svelte"

  export let npub
  export let activeTab
  export let relays = []

  const tabs = ["notes", "likes", Env.FORCE_RELAYS.length === 0 && "relays"].filter(identity)
  const pubkey = toHex(npub)
  const handle = Nip05.handles.key(pubkey)
  const profile = Directory.profiles.key(pubkey).derived(defaultTo({pubkey}))

  let loading = true
  let rgb, rgba

  $: ownRelays = Nip65.getPubkeyRelays(pubkey)
  $: relays = Nip65.getPubkeyHints(10, pubkey)

  $: {
    const color = parseHex(getThemeColor($theme, "gray-8"))

    rgba = `rgba(${color.join(", ")}, 0.4)`
    rgb = `rgba(${color.join(", ")})`
  }

  log("Person", npub, $profile)

  PubkeyLoader.load([pubkey], {force: true})

  document.title = Directory.displayProfile($profile)

  const setActiveTab = tab => navigate(routes.person(pubkey, tab))
</script>

<div
  class="absolute left-0 h-64 w-full"
  style="z-index: -1;
         background-size: cover;
         background-image:
          linear-gradient(to bottom, {rgba}, {rgb}),
          url('{$profile.banner}')" />

<Content>
  <div class="flex gap-4 text-gray-1">
    <PersonCircle {pubkey} size={16} class="sm:h-32 sm:w-32" />
    <div class="flex flex-grow flex-col gap-4">
      <div class="flex items-start justify-between gap-4">
        <div class="flex flex-grow flex-col gap-2">
          <div class="flex items-center gap-2">
            <h1 class="text-2xl">{Directory.displayProfile($profile)}</h1>
          </div>
          {#if $handle}
            <div class="flex gap-1 text-sm">
              <i class="fa fa-user-check text-accent" />
              <span class="text-gray-1">{Nip05.displayHandle($handle)}</span>
            </div>
          {/if}
        </div>
        <PersonActions {pubkey} />
      </div>
      <PersonAbout {pubkey} />
      <PersonStats {pubkey} />
    </div>
  </div>

  <Tabs {tabs} {activeTab} {setActiveTab} />

  {#if activeTab === "notes"}
    <PersonNotes {pubkey} {relays} />
  {:else if activeTab === "likes"}
    <PersonLikes {pubkey} {relays} />
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
