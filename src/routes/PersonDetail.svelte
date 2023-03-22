<script lang="ts">
  import {last, identity, find} from "ramda"
  import {onMount} from "svelte"
  import {tweened} from "svelte/motion"
  import {fly, fade} from "svelte/transition"
  import {navigate} from "svelte-routing"
  import {log} from "src/util/logger"
  import {renderContent, parseHex} from "src/util/html"
  import {numberFmt} from "src/util/misc"
  import {displayPerson, toHex} from "src/util/nostr"
  import Tabs from "src/partials/Tabs.svelte"
  import Content from "src/partials/Content.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import NewNoteButton from "src/views/notes/NewNoteButton.svelte"
  import Notes from "src/views/person/Notes.svelte"
  import Likes from "src/views/person/Likes.svelte"
  import Relays from "src/views/person/Relays.svelte"
  import user from "src/agent/user"
  import pool from "src/agent/pool"
  import {sampleRelays, getPubkeyWriteRelays} from "src/agent/relays"
  import network from "src/agent/network"
  import {getPersonWithFallback} from "src/agent/tables"
  import {routes, modal, theme, getThemeColor} from "src/app/ui"
  import PersonCircle from "src/partials/PersonCircle.svelte"

  export let npub
  export let activeTab
  export let relays = []

  const interpolate = (a, b) => t => a + Math.round((b - a) * t)
  const {petnamePubkeys, canPublish, mutes} = user
  const getRelays = () => sampleRelays(relays.concat(getPubkeyWriteRelays(pubkey)))
  const tabs = ["notes", "likes", pool.forceRelays.length === 0 && "relays"].filter(identity)

  let pubkey = toHex(npub)
  let following = false
  let muted = false
  let followersCount = tweened(0, {interpolate, duration: 1000})
  let person = getPersonWithFallback(pubkey)
  let loading = true
  let showActions = false
  let actions = []
  let rgb, rgba

  $: {
    const color = parseHex(getThemeColor($theme, "gray-8"))

    rgba = `rgba(${color.join(", ")}, 0.4)`
    rgb = `rgba(${color.join(", ")})`
  }

  $: following = $petnamePubkeys.includes(pubkey)
  $: muted = find(m => m[1] === pubkey, $mutes)

  $: {
    actions = []

    if (showActions) {
      actions.push({onClick: share, label: "Share", icon: "share-nodes"})

      if ($canPublish) {
        if (following) {
          actions.push({onClick: unfollow, label: "Unfollow", icon: "user-minus"})
        } else if (user.getPubkey() !== pubkey) {
          actions.push({onClick: follow, label: "Follow", icon: "user-plus"})
        }

        if (muted) {
          actions.push({onClick: unmute, label: "Muted", icon: "microphone-slash"})
        } else if (user.getPubkey() !== pubkey) {
          actions.push({onClick: mute, label: "Mute", icon: "microphone"})
        }

        actions.push({
          onClick: () => navigate(`/messages/${npub}`),
          label: "Message",
          icon: "envelope",
        })
      }

      if (pool.forceRelays.length === 0) {
        actions.push({onClick: openProfileInfo, label: "Profile", icon: "info"})
      }

      if (user.getPubkey() === pubkey && $canPublish) {
        actions.push({
          onClick: () => navigate("/profile"),
          label: "Edit",
          icon: "edit",
        })
      }
    }
  }

  onMount(async () => {
    log("Person", npub, person)

    document.title = displayPerson(person)

    // Refresh our person
    network.loadPeople([pubkey], {force: true}).then(() => {
      person = getPersonWithFallback(pubkey)
      loading = false
    })

    // Get our followers count
    const count = await pool.count({kinds: [3], "#p": [pubkey]})

    if (count) {
      followersCount.set(count)
    } else {
      const followers = new Set()

      await network.load({
        shouldProcess: false,
        relays: getRelays(),
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

  const toggleActions = () => {
    showActions = !showActions
  }

  const setActiveTab = tab => navigate(routes.person(pubkey, tab))

  const showFollows = () => {
    modal.set({type: "person/follows", pubkey})
  }

  const showFollowers = () => {
    modal.set({type: "person/followers", pubkey})
  }

  const follow = async () => {
    const [{url}] = getRelays()

    user.addPetname(pubkey, url, displayPerson(person))
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
    modal.set({type: "person/info", person})
  }

  const share = () => {
    modal.set({type: "person/share", person})
  }
</script>

<svelte:window
  on:click={() => {
    showActions = false
  }} />

<div
  class="absolute left-0 h-64 w-full"
  style="z-index: -1;
         background-size: cover;
         background-image:
          linear-gradient(to bottom, {rgba}, {rgb}),
          url('{person.kind0?.banner}')" />

<Content>
  <div class="flex gap-4 text-gray-1">
    <PersonCircle {person} size={16} class="sm:h-32 sm:w-32" />
    <div class="flex flex-grow flex-col gap-4">
      <div class="flex items-start justify-between gap-4">
        <div class="flex flex-grow flex-col gap-2">
          <div class="flex items-center gap-2">
            <h1 class="text-2xl">{displayPerson(person)}</h1>
          </div>
          {#if person.verified_as}
            <div class="flex gap-1 text-sm">
              <i class="fa fa-user-check text-accent" />
              <span class="text-gray-1">{last(person.verified_as.split("@"))}</span>
            </div>
          {/if}
        </div>
        <div class="relative flex flex-wrap gap-3 whitespace-nowrap">
          <div on:click|stopPropagation={toggleActions} class="cursor-pointer px-5 py-2">
            <i class="fa fa-xl fa-ellipsis-vertical" />
          </div>
          <div class="absolute top-0 right-0 z-10 mt-12 flex flex-col gap-2 opacity-90">
            <div
              class="absolute inset-0 rounded-full bg-gray-8"
              class:hidden={!showActions}
              style="filter: blur(15px)"
              transition:fade|local />
            {#each actions as { onClick, href, label, icon }, i}
              <div
                class="z-10 flex cursor-pointer items-center justify-end gap-2"
                in:fly|local={{y: 20, delay: i * 30}}
                out:fly|local={{y: 20, delay: (actions.length - i - 1) * 30}}
                on:click={onClick}>
                <div class="text-gray-1">{label}</div>
                <Anchor type="button-circle">
                  <i class={`fa fa-${icon}`} />
                </Anchor>
              </div>
            {/each}
          </div>
        </div>
      </div>
      <p>{@html renderContent(person?.kind0?.about || "")}</p>
      {#if person?.petnames}
        <div class="flex gap-8" in:fly={{y: 20}}>
          <button on:click={showFollows}>
            <strong>{person.petnames.length}</strong> following
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
    <Notes {pubkey} />
  {:else if activeTab === "likes"}
    <Likes {pubkey} />
  {:else if activeTab === "relays"}
    {#if getRelays().length > 0}
      <Relays relays={getRelays()} />
    {:else if loading}
      <Spinner />
    {:else}
      <Content size="lg" class="text-center">Unable to show network for this person.</Content>
    {/if}
  {/if}
</Content>

<NewNoteButton {pubkey} />
