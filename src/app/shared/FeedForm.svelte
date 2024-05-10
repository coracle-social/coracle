<script lang="ts">
  import {quantify} from "hurdak"
  import {Kind, getAddress} from "@welshman/util"
  import {isAuthorFeed, isTagFeed, isRelayFeed, makeListFeed} from "@welshman/feeds"
  import Field from "src/partials/Field.svelte"
  import {showInfo} from "src/partials/Toast.svelte"
  import Subheading from "src/partials/Subheading.svelte"
  import Modal from "src/partials/Modal.svelte"
  import Card from "src/partials/Card.svelte"
  import Input from "src/partials/Input.svelte"
  import Textarea from "src/partials/Textarea.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import FeedField from "src/app/shared/FeedField.svelte"
  import {makeFeed, createFeed, editFeed, displayFeed} from "src/domain"
  import {
    publishDeletion,
    publishDeletionForEvent,
    createAndPublish,
    mention,
    hints,
  } from "src/engine"

  export let feed
  export let exit
  export let apply = null
  export let showSave = false
  export let showDelete = false

  const isTopicFeed = f => isTagFeed(f) && f[1] === "#t"

  const isMentionFeed = f => isTagFeed(f) && f[1] === "#p"

  const openSave = () => {
    saveIsOpen = true
  }

  const closeSave = () => {
    shouldClone = false
    saveIsOpen = false
  }

  const startClone = () => {
    shouldClone = true
    saveIsOpen = true
  }

  const stopClone = () => {
    shouldClone = false
  }

  const openDelete = () => {
    deleteIsOpen = true
  }

  const closeDelete = () => {
    deleteIsOpen = false
  }

  const confirmDelete = () => {
    publishDeletionForEvent(feed.event)
    exit()
  }

  const openListDelete = () => {
    listDeleteIsOpen = true
  }

  const closeListDelete = () => {
    listDeleteIsOpen = false
    exit()
  }

  const confirmListDelete = () => {
    publishDeletion([feed.list])
    exit()
  }

  const saveFeed = async () => {
    const relays = hints.WriteRelays().getUrls()

    // Create our lists
    let addresses: string[] = []
    await Promise.all(
      saveAsList.map(async i => {
        const subFeed = draft.definition[i]

        let template
        if (isAuthorFeed(subFeed)) {
          template = {kind: Kind.ListPeople, tags: subFeed.slice(1).map(mention)}
        } else if (isMentionFeed(subFeed)) {
          template = {kind: Kind.ListPeople, tags: subFeed.slice(2).map(mention)}
        } else if (isRelayFeed(subFeed)) {
          template = {kind: Kind.ListRelays, tags: subFeed.slice(1).map(url => ["r", url])}
        } else if (isTopicFeed(subFeed)) {
          template = {
            kind: Kind.ListInterests,
            tags: subFeed.slice(1).map(topic => ["t", topic]),
          }
        }

        if (template) {
          const pub = await createAndPublish({...template, relays})

          addresses.push(getAddress(pub.request.event))
        }
      }),
    )

    // Swap out various filters and use the new lists instead
    if (addresses.length > 0) {
      draft.definition = draft.definition
        .filter((f, i) => !saveAsList.includes(i))
        .concat([makeListFeed({addresses})])
    }

    const template = draft.event ? editFeed(draft) : createFeed(draft)
    const pub = await createAndPublish({...template, relays})

    showInfo("Your feed has been saved!")

    if (draft.list) {
      openListDelete()
    } else {
      exit(pub.request.event)
    }
  }

  let shouldClone = false
  let deleteIsOpen = false
  let saveIsOpen = showSave
  let listDeleteIsOpen = false
  let saveAsList = []

  $: draft = shouldClone ? makeFeed({definition: feed.definition}) : feed
</script>

<FeedField bind:feed={feed.definition} bind:saveAsList />

{#if !saveIsOpen}
  <Card class="flex flex-col justify-between sm:flex-row">
    <p>Would you like to save this feed?</p>
    <Anchor underline on:click={openSave} class="text-neutral-400">Save this feed</Anchor>
  </Card>
{:else if draft.event || draft.list}
  <Card class="flex flex-col justify-between sm:flex-row">
    <p>You are currently editing your {displayFeed(draft)} feed.</p>
    <Anchor underline on:click={startClone} class="text-neutral-400">
      Create a new feed instead
    </Anchor>
  </Card>
{:else if feed.event || feed.list}
  <Card class="flex flex-col justify-between sm:flex-row">
    <p>You are currently creating a new feed.</p>
    <Anchor underline on:click={stopClone} class="text-neutral-400">
      Edit your {displayFeed(feed)} feed instead
    </Anchor>
  </Card>
{/if}

{#if saveIsOpen}
  <Card class="relative">
    <FlexColumn>
      <Field label="Feed Name">
        <Input bind:value={draft.name} />
      </Field>
      <Field label="Feed Description">
        <Textarea bind:value={draft.description} />
      </Field>
      {#if saveAsList.length > 0}
        <p class="text-neutral-500">
          {quantify(saveAsList.length, "new list")} will be created based on the filters you've selected.
        </p>
      {/if}
    </FlexColumn>
    {#if !showSave}
      <div class="absolute right-2 top-2 h-4 w-4 cursor-pointer" on:click={closeSave}>
        <i class="fa fa-times" />
      </div>
    {/if}
  </Card>
{/if}

<div class="flex justify-between gap-2">
  <Anchor button on:click={() => exit()}>Discard</Anchor>
  <div class="flex gap-2">
    {#if showDelete}
      <Anchor button on:click={openDelete}>Delete</Anchor>
    {/if}
    {#if saveIsOpen && apply}
      <Anchor button accent on:click={saveFeed}>Save and apply</Anchor>
    {:else if saveIsOpen}
      <Anchor button accent on:click={saveFeed}>Save feed</Anchor>
    {:else if apply}
      <Anchor button accent on:click={apply}>Apply filter</Anchor>
    {/if}
  </div>
</div>

{#if deleteIsOpen}
  <Modal onEscape={closeDelete}>
    <Subheading>Confirm deletion</Subheading>
    <p>
      Are you sure you want to delete your {displayFeed(feed)} feed?
    </p>
    <div class="flex justify-between gap-2">
      <Anchor button on:click={closeDelete}>Cancel</Anchor>
      <Anchor button danger on:click={confirmDelete}>Confirm</Anchor>
    </div>
  </Modal>
{/if}

{#if listDeleteIsOpen}
  <Modal onEscape={closeListDelete}>
    <Subheading>Format changed</Subheading>
    <p>
      This feed was using an old format. We have created a new version of the feed for you. Would
      you like to delete the old version?
    </p>
    <div class="flex justify-between">
      <Anchor button on:click={closeListDelete}>Keep it</Anchor>
      <Anchor button accent on:click={confirmListDelete}>Delete it</Anchor>
    </div>
  </Modal>
{/if}
