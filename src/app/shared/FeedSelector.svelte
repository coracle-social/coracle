<script lang="ts">
  import {sortBy, equals, uniqBy, identity} from "@welshman/lib"
  import {getAddress, displayRelayUrl, POLL, LONG_FORM, PICTURE_NOTE} from "@welshman/util"
  import {
    makeScopeFeed,
    makeKindFeed,
    makeRelayFeed,
    makeIntersectionFeed,
    Scope,
  } from "@welshman/feeds"
  import {relaySearch} from "@welshman/app"
  import {boolCtrl} from "src/partials/utils"
  import Modal from "src/partials/Modal.svelte"
  import Chip from "src/partials/Chip.svelte"
  import Button from "src/partials/Button.svelte"
  import SearchSelect from "src/partials/SearchSelect.svelte"
  import {router} from "src/app/util"
  import {noteKinds, reactionKinds, repostKinds} from "src/util/nostr"
  import {normalizeFeedDefinition, makeFeed, mapListToFeed, displayFeed} from "src/domain"
  import {
    userLists,
    userListFeeds,
    userFeeds,
    userFavoritedFeeds,
    userRelayFeeds,
    setRelayFeeds,
  } from "src/engine"

  export let feed
  export let setFeed

  const relayModal = boolCtrl()

  const makeFollowingFeed = (title, kinds) =>
    makeFeed({
      title,
      definition: makeIntersectionFeed(makeScopeFeed(Scope.Follows), makeKindFeed(...kinds)),
    })

  const followingFeeds = [
    makeFollowingFeed("Notes & Replies", noteKinds),
    makeFollowingFeed("Polls", [POLL]),
    makeFollowingFeed("Articles", [LONG_FORM]),
    makeFollowingFeed("Media", [PICTURE_NOTE]),
    makeFollowingFeed("Reposts", repostKinds),
    makeFollowingFeed("Reactions", reactionKinds),
    makeFollowingFeed("Everything", [...noteKinds, ...repostKinds, ...reactionKinds]),
  ]

  const editFeeds = () => router.at("feeds").open()

  const editLists = () => router.at("lists").open()

  const openRelayModal = () => {
    relayValues = [...$userRelayFeeds]
    $relayModal.enable()
  }

  const submitRelays = () => {
    setRelayFeeds(relayValues)
    $relayModal.disable()
  }

  let relayValues = []

  $: relayFeeds = $userRelayFeeds.map(url =>
    makeFeed({
      title: displayRelayUrl(url),
      definition: normalizeFeedDefinition(makeRelayFeed(url)),
    }),
  )
  $: listFeeds = sortBy(displayFeed, $userLists.map(mapListToFeed))
  $: allFeeds = uniqBy(
    feed => getAddress(feed.event),
    sortBy(displayFeed, [...$userFeeds, ...$userListFeeds, ...$userFavoritedFeeds]),
  )
</script>

<p class="staatliches text-2xl">Your Feeds</p>
<div class="flex flex-col gap-2">
  <strong>From People you Follow</strong>
  <div class="flex flex-wrap gap-1">
    {#each followingFeeds as other}
      <Chip
        class="cursor-pointer"
        accent={equals(other.definition, feed.definition)}
        on:click={() => setFeed(other)}>
        {displayFeed(other)}
      </Chip>
    {/each}
  </div>
</div>
<div class="flex flex-col gap-2">
  <strong>Relay Feeds</strong>
  <div class="flex flex-wrap gap-1">
    {#each relayFeeds as other}
      <Chip
        class="cursor-pointer"
        accent={equals(other.definition, feed.definition)}
        on:click={() => setFeed(other)}>
        {displayFeed(other)}
      </Chip>
    {/each}
    <Chip class="cursor-pointer" on:click={openRelayModal}>
      <i class="fa fa-edit" />
      Edit relay feeds
    </Chip>
  </div>
</div>
<div class="flex flex-col gap-2">
  <strong>Your Lists</strong>
  <div class="flex flex-wrap gap-1">
    {#each listFeeds as other}
      <Chip
        class="cursor-pointer"
        accent={equals(other.definition, feed.definition)}
        on:click={() => setFeed(other)}>
        {displayFeed(other)}
      </Chip>
    {/each}
    <Chip class="cursor-pointer" on:click={editLists}>
      <i class="fa fa-edit" />
      Edit lists
    </Chip>
  </div>
</div>
<div class="flex flex-col gap-2">
  <strong>Custom Feeds</strong>
  <div class="flex flex-wrap gap-1">
    {#each allFeeds as other}
      <Chip
        class="cursor-pointer"
        accent={equals(other.definition, feed.definition)}
        on:click={() => setFeed(other)}>
        {displayFeed(other)}
      </Chip>
    {/each}
    <Chip class="cursor-pointer" on:click={editFeeds}>
      <i class="fa fa-edit" />
      Edit feeds
    </Chip>
  </div>
</div>

{#if $relayModal.enabled}
  <Modal onEscape={$relayModal.disable}>
    <div class="flex flex-col gap-2">
      <p class="staatliches text-2xl">Edit relays</p>
      <p class="text-neutral-200">Search known relays to add to your relay feeds.</p>
    </div>
    <SearchSelect
      multiple
      bind:value={relayValues}
      search={$relaySearch.searchValues}
      termToItem={identity}>
      <span slot="item" let:item>{displayRelayUrl(item)}</span>
    </SearchSelect>
    <div class="flex justify-end">
      <Button class="btn btn-accent" on:click={submitRelays}>Save relays</Button>
    </div>
  </Modal>
{/if}
