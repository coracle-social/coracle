<script lang="ts">
  import {debounce} from "throttle-debounce"
  import {sortBy, equals, uniqBy, identity} from "@welshman/lib"
  import {getAddress, displayRelayUrl, POLL, LONG_FORM, PICTURE_NOTE} from "@welshman/util"
  import {
    isSearchFeed,
    makeScopeFeed,
    makeKindFeed,
    makeRelayFeed,
    makeIntersectionFeed,
    Scope,
    makeSearchFeed,
    getFeedArgs,
  } from "@welshman/feeds"
  import {signer, relaySearch} from "@welshman/app"
  import {toSpliced} from "src/util/misc"
  import {boolCtrl} from "src/partials/utils"
  import Card from "src/partials/Card.svelte"
  import Modal from "src/partials/Modal.svelte"
  import Input from "src/partials/Input.svelte"
  import Chip from "src/partials/Chip.svelte"
  import Button from "src/partials/Button.svelte"
  import SearchSelect from "src/partials/SearchSelect.svelte"
  import FeedForm from "src/app/shared/FeedForm.svelte"
  import {router} from "src/app/util"
  import {noteKinds, reactionKinds, repostKinds} from "src/util/nostr"
  import {normalizeFeedDefinition, makeFeed, readFeed, displayFeed} from "src/domain"
  import {
    userListFeeds,
    deleteEvent,
    userFeeds,
    userFavoritedFeeds,
    userRelayFeeds,
    setRelayFeeds,
  } from "src/engine"

  export let feed
  export let updateFeed

  feed.definition = normalizeFeedDefinition(feed.definition)

  const form = boolCtrl()
  const relayModal = boolCtrl()

  const openForm = () => {
    savePoint = {...feed}
    $form.enable()
  }

  const closeForm = () => {
    feed = savePoint
    $form.disable()
  }

  const getSearch = definition => (getFeedArgs(definition)?.find(isSearchFeed)?.[1] as string) || ""

  const setFeedDefinition = definition => {
    feed = {...feed, definition}
    search = getSearch(definition)
    $form.disable()
    updateFeed(feed)
  }

  const setSubFeed = subFeed => {
    const idx = feed.definition.findIndex(f => f[0] === subFeed[0])

    setFeedDefinition(
      idx >= 0 ? toSpliced(feed.definition, idx, 1, subFeed) : [...feed.definition, subFeed],
    )
  }

  const removeSubFeed = subFeed => {
    setFeedDefinition(feed.definition.filter(f => f !== subFeed))
  }

  const setFeed = newFeed => {
    feed = newFeed
    setFeedDefinition(feed.definition)
  }

  const editFeeds = () => router.at("feeds").open()

  const exitForm = event => {
    if (event) {
      if (feed.list) {
        deleteEvent(feed.list.event)
      }

      setFeed(readFeed(event))
    }

    closeForm()
  }

  const onSearchBlur = debounce(500, () => {
    const text = search.trim()

    if (text) {
      setSubFeed(makeSearchFeed(text))
    } else {
      removeSubFeed(subFeeds.find(isSearchFeed))
    }
  })

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

  const openRelayModal = () => {
    relayValues = [...$userRelayFeeds]
    $relayModal.enable()
  }

  const submitRelays = () => {
    setRelayFeeds(relayValues)
    $relayModal.disable()
  }

  let savePoint
  let relayValues = []
  let search = getSearch(feed.definition)

  $: relayFeeds = $userRelayFeeds.map(url =>
    makeFeed({
      title: displayRelayUrl(url),
      definition: normalizeFeedDefinition(makeRelayFeed(url)),
    }),
  )
  $: subFeeds = getFeedArgs(feed.definition as any)
  $: allFeeds = uniqBy(
    feed => getAddress(feed.event),
    sortBy(displayFeed, [...$userFeeds, ...$userListFeeds, ...$userFavoritedFeeds]),
  )
</script>

<div class="flex flex-col gap-4">
  <div class="flex flex-grow items-center justify-end gap-2">
    <Input dark class="hidden xs:block" on:input={onSearchBlur} bind:value={search}>
      <div slot="after" class="hidden text-white xs:block">
        <i class="fa fa-search" />
      </div>
    </Input>
    <slot name="controls" />
    {#if $signer}
      <Button class="btn btn-low" on:click={openForm}>Customize</Button>
    {/if}
  </div>
  <Card class="flex flex-col gap-4">
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
  </Card>
</div>

{#if $form.enabled}
  <Modal onEscape={closeForm}>
    <FeedForm
      {feed}
      exit={exitForm}
      showDelete={Boolean(feed.event)}
      apply={() => setFeedDefinition(feed.definition)} />
  </Modal>
{/if}

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
