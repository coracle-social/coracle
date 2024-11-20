<script lang="ts">
  import {debounce} from "throttle-debounce"
  import {equals} from "ramda"
  import {sortBy, uniqBy} from "@welshman/lib"
  import {getAddress} from "@welshman/util"
  import {isSearchFeed, makeSearchFeed, makeScopeFeed, Scope, getFeedArgs} from "@welshman/feeds"
  import {signer} from "@welshman/app"
  import {toSpliced} from "src/util/misc"
  import {boolCtrl} from "src/partials/utils"
  import Modal from "src/partials/Modal.svelte"
  import Input from "src/partials/Input.svelte"
  import Popover2 from "src/partials/Popover2.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Menu from "src/partials/Menu.svelte"
  import MenuItem from "src/partials/MenuItem.svelte"
  import FeedForm from "src/app/shared/FeedForm.svelte"
  import {router} from "src/app/util"
  import {normalizeFeedDefinition, readFeed, makeFeed, displayFeed} from "src/domain"
  import {userListFeeds, deleteEvent, userFeeds, userFavoritedFeeds} from "src/engine"

  export let feed
  export let updateFeed

  feed.definition = normalizeFeedDefinition(feed.definition)

  const form = boolCtrl()
  const listMenu = boolCtrl()
  const followsFeed = makeFeed({definition: normalizeFeedDefinition(makeScopeFeed(Scope.Follows))})
  const networkFeed = makeFeed({definition: normalizeFeedDefinition(makeScopeFeed(Scope.Network))})

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
    feed.definition = definition
    search = getSearch(definition)
    $form.disable()
    $listMenu.disable()
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

  let savePoint
  let search = getSearch(feed.definition)

  $: subFeeds = getFeedArgs(feed.definition as any)
  $: allFeeds = uniqBy(
    feed => getAddress(feed.event),
    sortBy(displayFeed, [...$userFeeds, ...$userListFeeds, ...$userFavoritedFeeds]),
  )
</script>

<div class="flex flex-col gap-1">
  <div class="flex flex-grow items-center justify-end gap-1">
    <div class="flex">
      <Input
        dark
        class="hidden rounded-r-none xs:block"
        on:input={onSearchBlur}
        bind:value={search}>
        <div slot="after" class="hidden text-white xs:block">
          <i class="fa fa-search" />
        </div>
      </Input>
      <Anchor button low class="border-none xs:rounded-l-none" on:click={openForm}>
        Filters ({feed.definition.length - 1})
      </Anchor>
    </div>
    <slot name="controls" />
  </div>
  <div class="flex flex-wrap justify-end gap-1">
    <Anchor
      button
      low={!equals(followsFeed.definition, feed.definition)}
      accent={equals(followsFeed.definition, feed.definition)}
      on:click={() => setFeed(followsFeed)}>
      Follows
    </Anchor>
    <Anchor
      button
      low={!equals(networkFeed.definition, feed.definition)}
      accent={equals(networkFeed.definition, feed.definition)}
      on:click={() => setFeed(networkFeed)}>
      Network
    </Anchor>
    {#each allFeeds as other}
      <Anchor
        button
        low={!equals(other.definition, feed.definition)}
        accent={equals(other.definition, feed.definition)}
        on:click={() => setFeed(other)}>
        {displayFeed(other)}
      </Anchor>
    {/each}
    {#if $signer}
      <div class="relative">
        <button
          type="button"
          class="flex h-7 w-6 cursor-pointer items-center justify-center rounded bg-neutral-700 text-center text-neutral-50 transition-colors hover:bg-neutral-600"
          on:click={$listMenu.enable}>
          <i class="fa fa-sm fa-ellipsis-v" />
        </button>
        {#if $listMenu.enabled}
          <Popover2 absolute hideOnClick onClose={$listMenu.disable} class="right-0 top-8 w-60">
            <Menu>
              <MenuItem href={router.at("feeds").toString()} class="flex items-center gap-2">
                <i class="fa fa-rss" /> Manage feeds
              </MenuItem>
              <MenuItem href={router.at("lists").toString()} class="flex items-center gap-2">
                <i class="fa fa-list" /> Manage lists
              </MenuItem>
            </Menu>
          </Popover2>
        {/if}
      </div>
    {/if}
  </div>
</div>

{#if $form.enabled}
  <Modal onEscape={closeForm}>
    <FeedForm {feed} exit={exitForm} apply={() => setFeedDefinition(feed.definition)} />
  </Modal>
{/if}
