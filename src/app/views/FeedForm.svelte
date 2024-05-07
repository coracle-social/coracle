<script lang="ts">
  import Card from "src/partials/Card.svelte"
  import Field from "src/partials/Field.svelte"
  import Subheading from "src/partials/Subheading.svelte"
  import Modal from "src/partials/Modal.svelte"
  import Input from "src/partials/Input.svelte"
  import Textarea from "src/partials/Textarea.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import FeedField from "src/app/shared/FeedField.svelte"
  import {router} from "src/app/util"
  import {initFeed, readFeed, createFeed, editFeed} from "src/domain"
  import {publishDeletionForEvent, repository, hints, createAndPublish} from "src/engine"

  export let address = null

  const values = address ? readFeed(repository.getEvent(address)) : initFeed()

  const abort = () => router.pop()

  const openDelete = () => {
    deleteIsOpen = true
  }

  const closeDelete = () => {
    deleteIsOpen = false
  }

  const confirmDelete = () => {
    publishDeletionForEvent(event)
    router.at("feeds").push()
  }

  const saveFeed = async () => {
    const relays = hints.WriteRelays().getUrls()
    const template = values.event ? editFeed(values) : createFeed(values)

    await createAndPublish({...template, relays})
  }

  let deleteIsOpen = false
</script>

<FeedField hideType={address} bind:feed={values.definition} />
<Card>
  <Field label="What would you like to name this feed?">
    <Input bind:value={values.name} />
  </Field>
  <Field label="How would you describe this feed?">
    <Textarea bind:value={values.description} />
  </Field>
</Card>
<div class="flex justify-between gap-2">
  <Anchor button on:click={abort}>Discard</Anchor>
  <div class="flex justify-between gap-2">
    {#if values.event}
      <Anchor button danger on:click={openDelete}>Delete</Anchor>
    {/if}
    <Anchor button accent on:click={saveFeed}>Save</Anchor>
  </div>
</div>

{#if deleteIsOpen}
  <Modal onEscape={closeDelete}>
    <Subheading>Confirm deletion</Subheading>
    <p>
      Are you sure you want to delete your "{values.name}" feed?
    </p>
    <div class="flex gap-2">
      <Anchor button on:click={closeDelete}>Cancel</Anchor>
      <Anchor button accent on:click={confirmDelete}>Confirm</Anchor>
    </div>
  </Modal>
{/if}
