<script lang="ts">
  import {last, identity, find} from "ramda"
  import {onMount} from "svelte"
  import {tweened} from "svelte/motion"
  import {fly} from "svelte/transition"
  import {navigate} from "svelte-routing"
  import {log} from "src/util/logger"
  import {parseHex} from "src/util/html"
  import {numberFmt} from "src/util/misc"
  import {displayPerson, toHex} from "src/util/nostr"
  import {modal, theme, getThemeColor} from "src/partials/state"
  import Tabs from "src/partials/Tabs.svelte"
  import Content from "src/partials/Content.svelte"
  import OverflowMenu from "src/partials/OverflowMenu.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import Notes from "src/app/views/PersonNotes.svelte"
  import Likes from "src/app/views/PersonLikes.svelte"
  import Relays from "src/app/views/PersonRelays.svelte"
  import user from "src/agent/user"
  import pool from "src/agent/pool"
  import {sampleRelays, getPubkeyWriteRelays} from "src/agent/relays"
  import network from "src/agent/network"
  import {getPersonWithFallback, watch} from "src/agent/db"
  import {routes} from "src/app/state"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"
  import PersonAbout from "src/app/shared/PersonAbout.svelte"

  export let npub
  export let activeTab
  export let relays = []

  const interpolate = (a, b) => t => a + Math.round((b - a) * t)
  const {petnamePubkeys, canPublish, mutes} = user
  const tabs = ["notes", "likes", pool.forceUrls.length === 0 && "relays"].filter(identity)
  const pubkey = toHex(npub)
  const person = watch("people", () => getPersonWithFallback(pubkey))

  let following = false
  let muted = false
  let followersCount = tweened(0, {interpolate, duration: 1000})
  let loading = true
  let actions = []
  let rgb, rgba

  $: ownRelays = getPubkeyWriteRelays(pubkey)
  $: relays = sampleRelays(relays.concat(ownRelays))

  $: {
    const color = parseHex(getThemeColor($theme, "gray-8"))

    rgba = `rgba(${color.join(", ")}, 0.4)`
    rgb = `rgba(${color.join(", ")})`
  }

  $: following = $petnamePubkeys.includes(pubkey)
  $: muted = find(m => m[1] === pubkey, $mutes)

  $: {
    actions = []

    if ($canPublish) {
      if (following) {
        actions.push({onClick: unfollow, label: "Unfollow", icon: "user-minus"})
      } else if (user.getPubkey() !== pubkey) {
        actions.push({onClick: follow, label: "Follow", icon: "user-plus"})
      }
    }

    actions.push({onClick: share, label: "Share", icon: "share-nodes"})

    if (user.getPubkey() !== pubkey && $canPublish) {
      actions.push({
        onClick: () => navigate(`/messages/${npub}`),
        label: "Message",
        icon: "envelope",
      })

      if (muted) {
        actions.push({onClick: unmute, label: "Unmute", icon: "microphone"})
      } else if (user.getPubkey() !== pubkey) {
        actions.push({onClick: mute, label: "Mute", icon: "microphone-slash"})
      }
    }

    if (pool.forceUrls.length === 0) {
      actions.push({onClick: openProfileInfo, label: "Details", icon: "info"})
    }

    if (user.getPubkey() === pubkey && $canPublish) {
      actions.push({
        onClick: () => navigate("/profile"),
        label: "Edit",
        icon: "edit",
      })
    }
  }

  onMount(async () => {
    log("Person", npub, $person)

    document.title = displayPerson($person)

    // Refresh our person
    network.loadPeople([pubkey], {relays, force: true}).then(() => {
      ownRelays = getPubkeyWriteRelays(pubkey)
      loading = false
    })

    // Get our followers count
    const count = await pool.count({kinds: [3], "#p": [pubkey]})

    if (count) {
      followersCount.set(count)
    } else {
      const followers = new Set()

      await network.load({
        relays,
        shouldProcess: false,
        filter: [{kinds: [3], "#p": [pubkey]}],
        onChunk: events => {
          for (const e of events) {
            followers.add(e.pubkey)
          }

          followersCount.set(followers.size)
        },
      })
    }
  })

  const setActiveTab = tab => navigate(routes.person(pubkey, tab))

  const showFollows = () => {
    modal.set({type: "person/follows", pubkey})
  }

  const showFollowers = () => {
    modal.set({type: "person/followers", pubkey})
  }

  const follow = async () => {
    const [{url}] = relays

    user.addPetname(pubkey, url, displayPerson($person))
  }

  const unfollow = async () => {
    user.removePetname(pubkey)
  }

  const mute = async () => {
    user.addMute("p", pubkey)
  }

  const unmute = async () => {
    user.removeMute(pubkey)
  }

  const openProfileInfo = () => {
    modal.set({type: "person/info", $person})
  }

  const share = () => {
    modal.set({type: "person/share", $person})
  }
</script>

<div
  class="absolute left-0 h-64 w-full"
  style="z-index: -1;
         background-size: cover;
         background-image:
          linear-gradient(to bottom, {rgba}, {rgb}),
          url('{$person.kind0?.banner}')" />

<Content>
  <div class="flex gap-4 text-gray-1">
    <PersonCircle person={$person} size={16} class="sm:h-32 sm:w-32" />
    <div class="flex flex-grow flex-col gap-4">
      <div class="flex items-start justify-between gap-4">
        <div class="flex flex-grow flex-col gap-2">
          <div class="flex items-center gap-2">
            <h1 class="text-2xl">{displayPerson($person)}</h1>
          </div>
          {#if $person.verified_as}
            <div class="flex gap-1 text-sm">
              <i class="fa fa-user-check text-accent" />
              <span class="text-gray-1">{last($person.verified_as.split("@"))}</span>
            </div>
          {/if}
        </div>
        <OverflowMenu {actions} />
      </div>
      <PersonAbout person={$person} />
      {#if $person?.petnames}
        <div class="flex gap-8" in:fly={{y: 20}}>
          <button on:click={showFollows}>
            <strong>{$person.petnames.length}</strong> following
          </button>
          <button on:click={showFollowers}>
            <strong>{numberFmt.format($followersCount)}</strong> followers
          </button>
        </div>
      {/if}
    </div>
  </div>

  <Tabs {tabs} {activeTab} {setActiveTab} />

  {#if activeTab === "notes"}
    <Notes {pubkey} {relays} />
  {:else if activeTab === "likes"}
    <Likes {pubkey} {relays} />
  {:else if activeTab === "relays"}
    {#if ownRelays.length > 0}
      <Relays relays={ownRelays} />
    {:else if loading}
      <Spinner />
    {:else}
      <Content size="lg" class="text-center">Unable to show network for this person.</Content>
    {/if}
  {/if}
</Content>
