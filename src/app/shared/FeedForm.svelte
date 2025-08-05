<script lang="ts">
  import {getAddress} from "@welshman/util"
  import {Router, addMaximalFallbacks} from "@welshman/router"
  import {pubkey, signer, displayProfileByPubkey, publishThunk} from "@welshman/app"
  import Field from "src/partials/Field.svelte"
  import {showInfo} from "src/partials/Toast.svelte"
  import Subheading from "src/partials/Subheading.svelte"
  import Modal from "src/partials/Modal.svelte"
  import Card from "src/partials/Card.svelte"
  import Input from "src/partials/Input.svelte"
  import Textarea from "src/partials/Textarea.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Button from "src/partials/Button.svelte"
  import FeedField from "src/app/shared/FeedField.svelte"
  import {makeFeed, createFeed, editFeed, displayFeed} from "src/domain"
  import {deleteEvent, removeFeedFavorite} from "src/engine"

  export let feed
  export let exit
  export let apply = null
  export let showSave = false
  export let showDelete = false

  const openSave = () => {
    saveIsOpen = true
  }

  const closeSave = () => {
    draft = {...feed}
    saveIsOpen = false
  }

  const startClone = () => {
    draft = makeFeed({definition: feed.definition})
    saveIsOpen = true
  }

  const stopClone = () => {
    draft = {...feed}
  }

  const openDelete = () => {
    deleteIsOpen = true
  }

  const closeDelete = () => {
    deleteIsOpen = false
  }

  const confirmDelete = () => {
    const event = feed.event || feed.list.event

    if (event.pubkey === $pubkey) {
      deleteEvent(event)
    } else {
      removeFeedFavorite(getAddress(event))
    }

    exit()
  }

  const openListDelete = () => {
    listDeleteIsOpen = true
  }

  const closeListDelete = () => {
    listDeleteIsOpen = false
    setTimeout(exit)
  }

  const saveFeed = async () => {
    const relays = Router.get().FromUser().policy(addMaximalFallbacks).getUrls()
    const event = draft.event ? editFeed(draft) : createFeed(draft)
    const thunk = await publishThunk({event, relays})

    showInfo("Your feed has been saved!")

    if (draft.list) {
      openListDelete()
    } else {
      exit(thunk.options.event)
    }
  }

  let deleteIsOpen = false
  let saveIsOpen = showSave
  let listDeleteIsOpen = false
  let draft = {...feed}

  // Sync definition in case they're editing it
  $: draft.definition = feed.definition
</script>

<FeedField bind:feed={feed.definition} />

{#if $signer}
  {#if !saveIsOpen}
    <Card class="flex flex-col justify-between sm:flex-row">
      <p>Would you like to save this feed?</p>
      <Button class="text-neutral-400 underline" on:click={openSave}>Save this feed</Button>
    </Card>
  {:else if draft.event || draft.list}
    {@const event = draft.event || draft.list.event}
    <Card class="flex flex-col justify-between sm:flex-row">
      {#if event.pubkey === $pubkey}
        <p>You are currently editing "{displayFeed(draft)}" feed.</p>
      {:else}
        <p>
          You are currently cloning "{displayFeed(feed)}" by @{displayProfileByPubkey(
            event.pubkey,
          )}.
        </p>
      {/if}
      <Button class="whitespace-nowrap text-neutral-400 underline" on:click={startClone}>
        Create a new feed instead
      </Button>
    </Card>
  {:else if feed.event || feed.list}
    <Card class="flex flex-col justify-between sm:flex-row">
      <p>You are currently creating a new feed.</p>
      <Button class="text-neutral-400 underline" on:click={stopClone}>
        Edit "{displayFeed(feed)}" instead
      </Button>
    </Card>
  {/if}
{/if}

{#if saveIsOpen}
  <Card class="relative">
    <FlexColumn>
      <Field label="Feed Name">
        <Input bind:value={draft.title} />
      </Field>
      <Field label="Feed Description">
        <Textarea bind:value={draft.description} />
      </Field>
    </FlexColumn>
    {#if !showSave}
      <button
        type="button"
        class="absolute right-2 top-2 h-4 w-4 cursor-pointer"
        on:click={closeSave}>
        <i class="fa fa-times" />
      </button>
    {/if}
  </Card>
{/if}

<div class="flex justify-between gap-2">
  <Button class="btn" on:click={() => exit()}>Discard</Button>
  {#if showDelete}
    <Button class="btn" on:click={openDelete}>Delete</Button>
  {/if}
  <div class="flex gap-2">
    {#if saveIsOpen && apply}
      <Button class="btn btn-accent" on:click={saveFeed}>Save and apply</Button>
    {:else if saveIsOpen}
      <Button class="btn btn-accent" on:click={saveFeed}>Save feed</Button>
    {:else if apply}
      <Button class="btn btn-accent" on:click={apply}>Apply filter</Button>
    {/if}
  </div>
</div>

{#if deleteIsOpen}
  <Modal onEscape={closeDelete}>
    <Subheading>Confirm deletion</Subheading>
    <p>
      Are you sure you want to delete your "{displayFeed(feed)}" feed?
    </p>
    <div class="flex justify-between gap-2">
      <Button class="btn" on:click={closeDelete}>Cancel</Button>
      <Button class="btn btn-danger" on:click={confirmDelete}>Confirm</Button>
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
      <Button class="btn" on:click={closeListDelete}>Keep it</Button>
      <Button class="btn btn-accent" on:click={confirmDelete}>Delete it</Button>
    </div>
  </Modal>
{/if}
