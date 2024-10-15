<script lang="ts">
  import {onMount} from "svelte"
  import {derived} from "svelte/store"
  import {groupBy, sortBy, uniq} from "ramda"
  import {ctx, pushToMapKey} from "@welshman/lib"
  import {
    pubkey,
    relays,
    relaySearch,
    type Relay,
    displayProfileByPubkey,
    profilesByPubkey,
    getRelayUrls,
    deriveRelaySelections,
    deriveInboxRelaySelections,
    getWriteRelayUrls,
    relaySelectionsByPubkey,
  } from "@welshman/app"
  import {Tags, isShareableRelayUrl, normalizeRelayUrl, profileHasName} from "@welshman/util"
  import {createScroller, displayList} from "src/util/misc"
  import {showWarning} from "src/partials/Toast.svelte"
  import Tabs from "src/partials/Tabs.svelte"
  import Modal from "src/partials/Modal.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Input from "src/partials/Input.svelte"
  import Subheading from "src/partials/Subheading.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import RelayCard from "src/app/shared/RelayCard.svelte"
  import Note from "src/app/shared/Note.svelte"
  import {load, userFollows, sortEventsDesc, joinRelay} from "src/engine"

  const tabs = ["search", "reviews"]

  const userRelaySelections = deriveRelaySelections($pubkey)

  const userInboxRelaySelections = deriveInboxRelaySelections($pubkey)

  const pubkeysByUrl = (() => {
    const m = new Map<string, string[]>()

    for (const pk of $userFollows) {
      if (!profileHasName($profilesByPubkey.get(pk))) {
        continue
      }

      for (const url of getWriteRelayUrls($relaySelectionsByPubkey.get(pk))) {
        pushToMapKey(m, url, pk)
      }
    }

    return m
  })()

  const searchRelays = derived(
    relays,
    $relays => (term: string) =>
      (term
        ? $relaySearch.searchOptions(term)
        : sortBy(p => -(pubkeysByUrl.get(p.url)?.length || 0), $relaySearch.options)
      ).map((relay: Relay) => {
        const pubkeys = pubkeysByUrl.get(relay.url) || []
        const description =
          pubkeys.length > 0
            ? "Used by " + displayList(pubkeys.map(displayProfileByPubkey))
            : relay.profile?.description

        return {...relay, description}
      }),
  )

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
  let currentRelayUrls: string[] = []

  $: currentRelayUrls = uniq([
    ...currentRelayUrls,
    ...getRelayUrls($userRelaySelections),
    ...getRelayUrls($userInboxRelaySelections),
  ]).sort()

  $: ratings = groupBy(e => {
    try {
      return normalizeRelayUrl(Tags.fromEvent(e).get("r")?.value())
    } catch (e) {
      return ""
    }
  }, reviews)

  load({
    relays: ctx.app.router.ReadRelays().getUrls(),
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
  {#if currentRelayUrls.length === 0}
    <div class="mt-8 flex items-center justify-center gap-2 text-center">
      <i class="fa fa-triangle-exclamation" />
      No relays connected
    </div>
  {/if}
  <div class="grid grid-cols-1 gap-4">
    {#each currentRelayUrls as url (url)}
      <RelayCard showStatus showControls {url} ratings={ratings[url]} />
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
    {#each $searchRelays(q).slice(0, limit) as { url, profile } (url)}
      <RelayCard {url} ratings={ratings[url]}>
        <p slot="description">{profile?.description || ""}</p>
      </RelayCard>
    {/each}
  {/if}
</FlexColumn>

{#if modal}
  <Modal onEscape={closeModal}>
    <Subheading>Add a relay</Subheading>
    <p>Enter a relay url below to add it to your relay selections.</p>
    <Input autofocus bind:value={customRelay} placeholder="wss://...">
      <i slot="before" class="fa fa-server" />
    </Input>
    <Anchor button accent on:click={confirmAddCustomRelay}>Add Relay</Anchor>
  </Modal>
{/if}
