<script lang="ts">
  import {onMount} from "svelte"
  import {derived} from "svelte/store"
  import type {RelayProfile} from "@welshman/util"
  import {nthEq, displayList, sortBy, uniq, groupBy, pushToMapKey} from "@welshman/lib"
  import {Router, addMaximalFallbacks} from "@welshman/router"
  import {
    pubkey,
    relays,
    relaySearch,
    displayProfileByPubkey,
    profilesByPubkey,
    deriveRelayList,
    deriveMessagingRelayList,
    relayListsByPubkey,
  } from "@welshman/app"
  import {
    isShareableRelayUrl,
    isRelayUrl,
    normalizeRelayUrl,
    profileHasName,
    getRelaysFromList,
    RelayMode,
  } from "@welshman/util"
  import {createScroller} from "src/util/misc"
  import {showWarning} from "src/partials/Toast.svelte"
  import Tabs from "src/partials/Tabs.svelte"
  import Modal from "src/partials/Modal.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Input from "src/partials/Input.svelte"
  import Subheading from "src/partials/Subheading.svelte"
  import Button from "src/partials/Button.svelte"
  import RelayCard from "src/app/shared/RelayCard.svelte"
  import FeedItem from "src/app/shared/FeedItem.svelte"
  import {myRequest, userFollows, sortEventsDesc, joinRelay} from "src/engine"

  const tabs = ["search", "reviews"]

  const userRelayList = deriveRelayList($pubkey)

  const userMessagingRelayList = deriveMessagingRelayList($pubkey)

  const pubkeysByUrl = (() => {
    const m = new Map<string, string[]>()

    for (const pk of $userFollows) {
      if (!profileHasName($profilesByPubkey.get(pk))) {
        continue
      }

      for (const url of getRelaysFromList($relayListsByPubkey.get(pk), RelayMode.Write)) {
        if (isShareableRelayUrl(url)) {
          pushToMapKey(m, url, pk)
        }
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
      ).map((relay: RelayProfile) => {
        const pubkeys = pubkeysByUrl.get(relay.url) || []
        const description =
          pubkeys.length > 0
            ? "Used by " + displayList(pubkeys.map(displayProfileByPubkey))
            : relay.description

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

    if (!isRelayUrl(url)) {
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
    ...getRelaysFromList($userRelayList),
    ...getRelaysFromList($userMessagingRelayList),
  ]).sort()

  $: ratings = groupBy(e => {
    try {
      return normalizeRelayUrl(e.tags.find(nthEq(0, "r"))?.[1])
    } catch (e) {
      return ""
    }
  }, reviews)

  const controller = new AbortController()

  myRequest({
    signal: controller.signal,
    relays: Router.get().ForUser().policy(addMaximalFallbacks).getUrls(),
    filters: [{kinds: [1985, 1986], "#l": ["review/relay"]}],
    onEvent: event => {
      if (isShareableRelayUrl(event.tags.find(nthEq(0, "r"))?.[1] || "")) {
        reviews = sortEventsDesc(reviews.concat(event))
      }
    },
  })

  onMount(() => {
    const scroller = createScroller(loadMore, {element})

    return () => {
      controller.abort()
      scroller.stop()
    }
  })

  document.title = "Relays"
</script>

<FlexColumn bind:element>
  <div class="flex justify-between">
    <div class="flex items-center gap-2">
      <i class="fa fa-server fa-lg" />
      <h2 class="staatliches text-2xl">Your relays</h2>
    </div>
    <Button class="btn btn-accent" on:click={addCustomRelay}>
      <i class="fa-solid fa-compass" /> Add Relay
    </Button>
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
      <FeedItem note={review} />
    {/each}
  {:else}
    <Input
      bind:value={q}
      type="text"
      class="flex-grow"
      placeholder="Search relays or add a custom url">
      <i slot="before" class="fa-solid fa-search" />
    </Input>
    {#each $searchRelays(q).slice(0, limit) as { url, description } (url)}
      <RelayCard {url} ratings={ratings[url]}>
        <p slot="description">{description}</p>
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
    <Button class="btn btn-accent" on:click={confirmAddCustomRelay}>Add Relay</Button>
  </Modal>
{/if}
