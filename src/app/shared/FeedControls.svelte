<script lang="ts">
  import {debounce} from "throttle-debounce"
  import {
    isScopeFeed,
    isSearchFeed,
    makeSearchFeed,
    makeScopeFeed,
    Scope,
    getFeedArgs,
  } from "@welshman/feeds"
  import Modal from "src/partials/Modal.svelte"
  import Input from "src/partials/Input.svelte"
  import Select from "src/partials/Select.svelte"
  import Popover2 from "src/partials/Popover2.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Menu from "src/partials/Menu.svelte"
  import MenuItem from "src/partials/MenuItem.svelte"
  import FeedForm from "src/app/shared/FeedForm.svelte"
  import {router} from "src/app/util"
  import {normalizeFeedDefinition, readFeed, makeFeed, listAsFeed, displayFeed} from "src/domain"
  import {displayList as displayList2, publishDeletion, userLists, userFeeds} from "src/engine"

  export let feed
  export let updateFeed

  feed.definition = normalizeFeedDefinition(feed.definition)

  const followsFeed = makeFeed({definition: normalizeFeedDefinition(makeScopeFeed(Scope.Follows))})
  const networkFeed = makeFeed({definition: normalizeFeedDefinition(makeScopeFeed(Scope.Network))})

  const openListMenu = () => {
    listMenuIsOpen = true
  }

  const closeListMenu = () => {
    listMenuIsOpen = false
  }

  const openForm = () => {
    savePoint = {...feed}
    formIsOpen = true
  }

  const closeForm = () => {
    feed = savePoint
    formIsOpen = false
  }

  const getSearch = definition => (getFeedArgs(definition)?.find(isSearchFeed)?.[1] as string) || ""

  const setFeedDefinition = definition => {
    feed.definition = definition
    search = getSearch(definition)
    formIsOpen = false
    closeListMenu()
    updateFeed(feed)
  }

  const setSubFeed = subFeed => {
    const idx = feed.definition.findIndex(f => f[0] === subFeed[0])

    setFeedDefinition(
      idx >= 0 ? feed.definition.toSpliced(idx, 1, subFeed) : [...feed.definition, subFeed],
    )
  }

  const removeSubFeed = subFeed => {
    setFeedDefinition(feed.definition.filter(f => f !== subFeed))
  }

  const setFeed = newFeed => {
    feed = newFeed
    setFeedDefinition(feed.definition)
  }

  const setList = list => {
    feed = listAsFeed(list)
    setFeedDefinition(feed.definition)
  }

  const exitForm = event => {
    if (event) {
      if (feed.list) {
        publishDeletion([feed.list])
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
  let formIsOpen = false
  let listMenuIsOpen = false
  let search = getSearch(feed.definition)

  $: subFeeds = getFeedArgs(feed.definition as any)
</script>

<div class="flex flex-grow items-center justify-end gap-2">
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
  <div class="float-right flex h-8 items-center justify-end gap-2">
    <slot name="controls" />
    <div class="relative lg:hidden">
      <div
        class="flex h-7 w-6 cursor-pointer items-center justify-center rounded bg-neutral-700 text-center text-neutral-50 transition-colors hover:bg-neutral-600"
        on:click={openListMenu}>
        <i class="fa fa-sm fa-ellipsis-v" />
      </div>
      {#if listMenuIsOpen}
        <Popover2 absolute hideOnClick onClose={closeListMenu} class="right-0 top-8 w-60">
          <Menu>
            <MenuItem inert class="flex items-center justify-between bg-neutral-800 shadow">
              <span class="staatliches text-lg">Your Feeds</span>
              <Anchor href={router.at("feeds").toString()}>
                <i class="fa fa-cog" />
              </Anchor>
            </MenuItem>
            <div class="max-h-96 overflow-auto">
              <MenuItem on:click={() => setFeed(followsFeed)}>Follows</MenuItem>
              <MenuItem on:click={() => setFeed(networkFeed)}>Network</MenuItem>
              {#each $userFeeds as event}
                <MenuItem on:click={() => setFeed(readFeed(event))}>
                  {displayFeed(readFeed(event))}
                </MenuItem>
              {/each}
              {#each $userLists as list}
                <MenuItem on:click={() => setList(list)}>{displayList2(list)}</MenuItem>
              {/each}
            </div>
          </Menu>
        </Popover2>
      {/if}
    </div>
  </div>
</div>

{#if formIsOpen}
  <Modal onEscape={closeForm}>
    <FeedForm {feed} exit={exitForm} apply={() => setFeedDefinition(feed.definition)} />
  </Modal>
{/if}
