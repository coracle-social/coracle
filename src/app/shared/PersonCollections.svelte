<script lang="ts">
  import {noop, nth, sortBy, uniqBy} from "@welshman/lib"
  import {Address, eventOutbox, getIdFilters, getIdAndAddress, outbox} from "@welshman/util"
  import type {TrustedEvent} from "@welshman/util"
  import type {BookmarkListReader} from "@welshman/domain"
  import Chip from "src/partials/Chip.svelte"
  import Subheading from "src/partials/Subheading.svelte"
  import FeedItem from "src/app/shared/FeedItem.svelte"
  import {deriveEvents, fromApp, resolveRelays} from "src/engine/core"
  import {BookmarkLists, loadLabels, deriveCollections, myLoad} from "src/engine"

  export let pubkey

  const collections = deriveCollections(pubkey)
  const bookmarkList = fromApp($app => $app.use(BookmarkLists).one(pubkey))

  const getBookmarkTags = (list: BookmarkListReader) => {
    const values = new Set([...list.ids(), ...list.addresses()])

    // Bookmarks are appended to the list, so show the most recent ones first
    return uniqBy(
      nth(1),
      list.tags().filter(t => values.has(t[1])),
    ).reverse()
  }

  const getBookmarkRef = ([type, value, relay]: string[]) => {
    const relays = relay ? [relay] : []

    return type === "a" ? {...Address.from(value), relays} : {id: value, relays}
  }

  const loadBookmarks = async (tags: string[][]) => {
    const relays = await resolveRelays([
      outbox(pubkey),
      ...tags.map(tag => eventOutbox(getBookmarkRef(tag))),
    ])

    await myLoad({relays, filters: getIdFilters(tags.map(nth(1)))})
  }

  const getBookmarkIndex = (event: TrustedEvent) =>
    bookmarks.findIndex(value => getIdAndAddress(event).includes(value))

  const setSelection = collection => {
    selection = collection
    showBookmarks = false
  }

  const selectBookmarks = () => {
    selection = undefined
    showBookmarks = true
  }

  let selection
  let showBookmarks = false

  $: bookmarkTags = $bookmarkList ? getBookmarkTags($bookmarkList) : []
  $: bookmarks = bookmarkTags.map(nth(1))
  $: bookmarkedEvents = deriveEvents(getIdFilters(bookmarks))

  $: if (showBookmarks) {
    loadBookmarks(bookmarkTags).catch(noop)
  }

  loadLabels([pubkey])
</script>

<div class="flex gap-2">
  <div class="my-1">Select a collection:</div>
  <div class="-mb-2">
    {#if bookmarks.length > 0}
      <Chip class="mb-2 mr-2 inline-block cursor-pointer" on:click={selectBookmarks}>
        <i class="fa fa-bookmark" /> Bookmarks
      </Chip>
    {/if}
    {#each $collections as collection (collection.name)}
      <Chip class="mb-2 mr-2 inline-block cursor-pointer" on:click={() => setSelection(collection)}
        >{collection.name}</Chip>
    {/each}
  </div>
</div>

{#if showBookmarks}
  <Subheading>Bookmarks</Subheading>
  {#each sortBy(getBookmarkIndex, $bookmarkedEvents) as event (event.id)}
    <FeedItem note={event} />
  {/each}
{:else if selection}
  <Subheading>#{selection.name}</Subheading>
  {#each selection.ids as id (id)}
    <FeedItem note={{id}} />
  {/each}
{/if}
