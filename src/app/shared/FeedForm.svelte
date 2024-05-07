<script lang="ts">
  import Field from "src/partials/Field.svelte"
  import {showInfo} from "src/partials/Toast.svelte"
  import Subheading from "src/partials/Subheading.svelte"
  import Modal from "src/partials/Modal.svelte"
  import Card from "src/partials/Card.svelte"
  import Input from "src/partials/Input.svelte"
  import Textarea from "src/partials/Textarea.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import FeedField from "src/app/shared/FeedField.svelte"
  import {router} from "src/app/util"
  import {initFeed, createFeed, editFeed, displayFeed} from "src/domain"
  import {publishDeletionForEvent, hints, createAndPublish} from "src/engine"

  export let feed
  export let onSave

  const switchToCreate = () => {
    feed = initFeed({definition: feed.definition})
    saveIsOpen = true
  }

  const openDelete = () => {
    deleteIsOpen = true
  }

  const closeDelete = () => {
    deleteIsOpen = false
  }

  const confirmDelete = () => {
    if (feed.event) {
      publishDeletionForEvent(feed.event)
    }

    router.at("feeds").push()
  }

  const openSave = () => {
    saveIsOpen = true
  }

  const closeSave = () => {
    saveIsOpen = false
  }

  const saveFeed = async () => {
    const relays = hints.WriteRelays().getUrls()
    const template = feed.event ? editFeed(feed) : createFeed(feed)
    const pub = await createAndPublish({...template, relays})

    showInfo("Your feed has been saved!")
    onSave(pub.request.event)
  }

  let saveIsOpen = false
  let deleteIsOpen = false

  $: isEdit = feed.event || feed.list
</script>

<FeedField bind:feed={feed.definition} />
{#if isEdit}
  <Card class="flex flex-col sm:flex-row justify-between">
    <p>You are currently editing your {displayFeed(feed)} feed.</p>
    <Anchor underline on:click={switchToCreate} class="text-neutral-400">
      Create a new feed instead
    </Anchor>
  </Card>
{:else if saveIsOpen}
  <Modal onEscape={closeSave}>
    <Field label="Feed Name">
      <Input bind:value={feed.name} />
    </Field>
    <Field label="Feed Description">
      <Textarea bind:value={feed.description} />
    </Field>
    <div class="flex justify-between gap-2">
      <Anchor button on:click={closeSave}>Cancel</Anchor>
      <Anchor button accent on:click={saveFeed}>Save</Anchor>
    </div>
  </Modal>
{/if}
<slot name="controls" {feed} remove={openDelete} save={isEdit ? saveFeed : openSave} />
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
