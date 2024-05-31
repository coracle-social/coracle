<script lang="ts">
  import {onMount} from "svelte"
  import {mergeLeft, groupBy, sortBy, uniqBy, prop, drop} from "ramda"
  import {displayList} from "hurdak"
  import {derived} from "@welshman/lib"
  import {Tags, isShareableRelayUrl, normalizeRelayUrl} from "@welshman/util"
  import {pushToKey, createScroller} from "src/util/misc"
  import {showWarning} from "src/partials/Toast.svelte"
  import Tabs from "src/partials/Tabs.svelte"
  import Modal from "src/partials/Modal.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Input from "src/partials/Input.svelte"
  import Subheading from "src/partials/Subheading.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import RelayCard from "src/app/shared/RelayCard.svelte"
  import Note from "src/app/shared/Note.svelte"
  import {profileHasName} from "src/domain"
  import type {Relay} from "src/engine"
  import {
    load,
    hints,
    relays,
    pubkey,
    userFollows,
    deriveRelay,
    getProfile,
    displayProfileByPubkey,
    relayPolicies,
    relayPolicyUrls,
    getRelaySearch,
    getPubkeyRelayUrls,
    sortEventsDesc,
    joinRelay,
    broadcastUserData,
    loadPubkeyRelays,
  } from "src/engine"

  const tabs = ["search", "reviews"]

  const pubkeysByUrl = (() => {
    const m = new Map<string, string[]>()

    for (const pk of $userFollows) {
      if (!profileHasName(getProfile(pk))) {
        continue
      }

      for (const url of getPubkeyRelayUrls(pk, "write")) {
        pushToKey(m, url, pk)
      }
    }

    return m
  })()

  const searchRelays = derived([relays, relayPolicyUrls], ([$relays, $relayPolicyUrls]) => {
    const annotate = (r: Relay): Relay => {
      const pubkeys = pubkeysByUrl.get(r.url) || []
      const description =
        pubkeys.length > 0
          ? "Used by " + displayList(pubkeys.map(displayProfileByPubkey))
          : r.info?.description

      return {...r, info: {...r.info, description}}
    }

    const allRelays = sortBy(
      (r: Relay) => -r.count,
      $relays.filter((r: Relay) => !$relayPolicyUrls.includes(r.url)).map(annotate),
    )

    const search = getRelaySearch(allRelays)

    return (term: string): Relay[] => {
      if (!term) {
        const result = sortBy(
          (r: Relay) => -(pubkeysByUrl.get(r.url)?.length || 0),
          Array.from(pubkeysByUrl.keys()).map(url => annotate(deriveRelay(url).get())),
        )

        // Drop the top 10 most popular relays to avoid network centralization
        return uniqBy(
          prop("url"),
          drop(Math.min(10, Math.max(0, result.length - 10)), result).concat(allRelays),
        )
      }

      return search(term)
    }
  })

  const setActiveTab = tab => {
    activeTab = tab
  }

  const loadMore = async () => {
    limit += 20
  }

  const addCustomRelay = () => {
    modal = "add_relay"
  }

  const confirmAddCustomRelay = () => {
    const url = normalizeRelayUrl(customRelay)

    if (!isShareableRelayUrl(url)) {
      showWarning("Please provide a valid relay url")
    } else {
      joinRelay(url)
      broadcastUserData([url])
      closeModal()
    }
  }

  const closeModal = () => {
    customRelay = ""
    modal = null
  }

  let q = ""
  let limit = 20
  let modal = null
  let element = null
  let reviews = []
  let activeTab = "search"
  let customRelay = ""
  let currentRelayPolicies = $relayPolicies

  $: currentRelayPolicies = sortBy(
    prop("url"),
    uniqBy(
      prop("url"),
      $relayPolicies.concat(currentRelayPolicies.map(mergeLeft({read: false, write: false}))),
    ),
  )

  $: ratings = groupBy(e => {
    try {
      return normalizeRelayUrl(Tags.fromEvent(e).get("r")?.value())
    } catch (e) {
      return ""
    }
  }, reviews)

  // Force reload user relays to make sure we're up to date
  if ($pubkey) {
    loadPubkeyRelays([$pubkey], {force: true})
  }

  load({
    relays: hints.ReadRelays().getUrls(),
    filters: [{kinds: [1985, 1986], "#l": ["review/relay"]}],
    onEvent: event => {
      if (isShareableRelayUrl(Tags.fromEvent(event).get("r")?.value())) {
        reviews = sortEventsDesc(reviews.concat(event))
      }
    },
  })

  onMount(() => {
    const scroller = createScroller(loadMore, {element})

    return () => scroller.stop()
  })

  document.title = "Relays"
</script>

<FlexColumn bind:element>
  <div class="flex justify-between">
    <div class="flex items-center gap-2">
      <i class="fa fa-server fa-lg" />
      <h2 class="staatliches text-2xl">Your relays</h2>
    </div>
    <Anchor button accent on:click={addCustomRelay}>
      <i class="fa-solid fa-compass" /> Add Relay
    </Anchor>
  </div>
  <p>
    Relays are hubs for your content and connections. At least one is required to interact with the
    network, but you can join as many as you like.
  </p>
  {#if currentRelayPolicies.length === 0}
    <div class="mt-8 flex items-center justify-center gap-2 text-center">
      <i class="fa fa-triangle-exclamation" />
      No relays connected
    </div>
  {/if}
  <div class="grid grid-cols-1 gap-4">
    {#each currentRelayPolicies as policy (policy.url)}
      <RelayCard showStatus showControls relay={policy} ratings={ratings[policy.url]} />
    {/each}
  </div>
  <div class="flex items-center gap-2">
    <i class="fa fa-circle-nodes fa-lg" />
    <h2 class="staatliches text-2xl">Other relays</h2>
  </div>
  <p>
    Below are relays used by people in your network. Adding these may improve your ability to load
    profiles and content.
  </p>
  <Tabs {tabs} {activeTab} {setActiveTab} />
  {#if activeTab === "reviews"}
    {#each reviews.slice(0, limit) as review (review.id)}
      <Note note={review} />
    {/each}
  {:else}
    <Input
      bind:value={q}
      type="text"
      class="flex-grow"
      placeholder="Search relays or add a custom url">
      <i slot="before" class="fa-solid fa-search" />
    </Input>
    {#each $searchRelays(q).slice(0, limit) as relay (relay.url)}
      <RelayCard {relay} ratings={ratings[relay.url]} />
    {/each}
  {/if}
</FlexColumn>

{#if modal}
  <Modal onEscape={closeModal}>
    <Subheading>Add a relay</Subheading>
    <p>Enter a relay url below to add it to your relay selections.</p>
    <Input bind:value={customRelay} placeholder="wss://...">
      <i slot="before" class="fa fa-server" />
    </Input>
    <Anchor button accent on:click={confirmAddCustomRelay}>Add Relay</Anchor>
  </Modal>
{/if}
