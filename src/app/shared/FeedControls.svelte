<script lang="ts">
  import {debounce} from "throttle-debounce"
  import {isSearchFeed, makeSearchFeed, getFeedArgs} from "@welshman/feeds"
  import {signer} from "@welshman/app"
  import {toSpliced} from "src/util/misc"
  import {boolCtrl} from "src/partials/utils"
  import Card from "src/partials/Card.svelte"
  import Modal from "src/partials/Modal.svelte"
  import Input from "src/partials/Input.svelte"
  import Button from "src/partials/Button.svelte"
  import FeedForm from "src/app/shared/FeedForm.svelte"
  import FeedSelector from "src/app/shared/FeedSelector.svelte"
  import {normalizeFeedDefinition, readFeed} from "src/domain"
  import {deleteEvent} from "src/engine"

  export let feed
  export let updateFeed

  feed.definition = normalizeFeedDefinition(feed.definition)

  const form = boolCtrl()

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
</script>

<div class="flex flex-col gap-4 pb-4">
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
  <Card
    class="flex flex-col gap-4 xl:fixed xl:bottom-4 xl:right-4 xl:top-20 xl:z-nav xl:w-80 xl:overflow-y-auto 2xl:w-96">
    <FeedSelector {feed} {setFeed} />
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
