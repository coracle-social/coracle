<script lang="ts">
  import {debounce} from "throttle-debounce"
  import {isScopeFeed, isSearchFeed, makeSearchFeed, Scope, getFeedArgs} from "@welshman/feeds"
  import Modal from "src/partials/Modal.svelte"
  import Input from "src/partials/Input.svelte"
  import Select from "src/partials/Select.svelte"
  import Popover2 from "src/partials/Popover2.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Menu from "src/partials/Menu.svelte"
  import MenuItem from "src/partials/MenuItem.svelte"
  import FeedForm from "src/app/shared/FeedForm.svelte"
  import {router} from "src/app/util"
  import {normalizeFeedDefinition, readFeed, initFeed, listAsFeed, displayFeed} from "src/domain"
  import {
    repository,
    displayList as displayList2,
    publishDeletion,
    userLists,
    userFeeds,
  } from "src/engine"

  export let opts
  export let address = null

  const openListMenu = () => {
    listMenuIsOpen = true
  }

  const closeListMenu = () => {
    listMenuIsOpen = false
  }

  const openForm = () => {
    formIsOpen = true
  }

  const closeForm = () => {
    formIsOpen = false
  }

  const toggleReplies = () => {
    opts = {...opts, shouldHideReplies: !opts.shouldHideReplies}
  }

  const getSearch = definition => (getFeedArgs(definition)?.find(isSearchFeed)?.[1] as string) || ""

  const setFeedDefinition = definition => {
    opts = {...opts, feed: definition}
    search = getSearch(definition)
    closeListMenu()
    closeForm()
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

  const setFeed = event => {
    feed = readFeed(event)
    setFeedDefinition(feed.definition)
  }

  const setList = list => {
    feed = listAsFeed(list)
    setFeedDefinition(feed.definition)
  }

  const saveFeed = event => {
    if (feed.list) {
      publishDeletion([feed.list])
    }

    setFeed(event)
  }

  const onSearchBlur = debounce(500, () => {
    const text = search.trim()

    if (text) {
      setSubFeed(makeSearchFeed(text))
    } else {
      removeSubFeed(subFeeds.find(isSearchFeed))
    }
  })

  let formIsOpen = false
  let listMenuIsOpen = false
  let feed = address
    ? readFeed(repository.getEvent(address))
    : initFeed({definition: normalizeFeedDefinition(opts.feed)})
  let search = getSearch(feed.definition)

  $: subFeeds = getFeedArgs(feed.definition as any)
</script>

<div class="flex justify-between">
  <Select
    value={subFeeds.find(isScopeFeed)?.[1] || null}
    class="hidden h-7 bg-tinted-700 text-neutral-200 sm:block">
    <option value={Scope.Follows}>Follows</option>
    <option value={Scope.Network}>Network</option>
    <option value={null}>Global</option>
  </Select>
  <div class="flex flex-grow items-center justify-end gap-2">
    <div class="flex">
      <Input
        class="hidden h-7 rounded-r-none bg-neutral-900 xs:block"
        on:input={onSearchBlur}
        bind:value={search}>
        <div slot="after" class="hidden text-white xs:block">
          <i class="fa fa-search" />
        </div>
      </Input>
      <Anchor button low class="h-7 border-none xs:rounded-l-none" on:click={openForm}>
        Filters ({feed.definition.length - 1})
      </Anchor>
    </div>
    <div class="float-right flex h-8 items-center justify-end gap-2">
      {#if opts.shouldHideReplies}
        <Anchor button low class="h-7 border-none opacity-50" on:click={toggleReplies}
          >Replies</Anchor>
      {:else}
        <Anchor button accent class="h-7 border-none" on:click={toggleReplies}>Replies</Anchor>
      {/if}
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
                {#each $userFeeds as event}
                  <MenuItem on:click={() => setFeed(event)}>
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
</div>

{#if formIsOpen}
  <Modal onEscape={closeForm}>
    <FeedForm {feed} onSave={saveFeed}>
      <div slot="controls" class="flex justify-between gap-2" let:save>
        <Anchor button on:click={closeForm}>Discard</Anchor>
        <div class="flex gap-2">
          <Anchor button on:click={save}>Save Feed</Anchor>
          <Anchor button accent on:click={() => setFeedDefinition(feed.definition)}>Done</Anchor>
        </div>
      </div>
    </FeedForm>
  </Modal>
{/if}
