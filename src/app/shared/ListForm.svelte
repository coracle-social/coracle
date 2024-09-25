<script lang="ts">
  import {ctx, identity} from "@welshman/lib"
  import {
    Tags,
    NAMED_PEOPLE,
    NAMED_RELAYS,
    NAMED_TOPICS,
    normalizeRelayUrl,
    displayRelayUrl,
  } from "@welshman/util"
  import {topicSearch, tagPubkey, relaySearch} from "@welshman/app"
  import {showInfo} from "src/partials/Toast.svelte"
  import Field from "src/partials/Field.svelte"
  import Modal from "src/partials/Modal.svelte"
  import Subheading from "src/partials/Subheading.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Input from "src/partials/Input.svelte"
  import SearchSelect from "src/partials/SearchSelect.svelte"
  import PersonSelect from "src/app/shared/PersonSelect.svelte"
  import {createAndPublish, deleteEvent} from "src/engine"
  import {KindSearch, createList, displayList, editList} from "src/domain"

  export let list
  export let exit
  export let hide = []
  export let showDelete = false

  const openDelete = () => {
    deleteIsOpen = true
  }

  const closeDelete = () => {
    deleteIsOpen = false
  }

  const confirmDelete = () => {
    deleteEvent(list.event)
    exit()
  }

  const submit = async () => {
    const relays = ctx.app.router.WriteRelays().getUrls()
    const template = list.event ? editList(list) : createList(list)
    const pub = await createAndPublish({...template, relays})

    showInfo("Your list has been saved!")
    exit(pub.request.event)
  }

  const kindsHelper = new KindSearch([
    {label: "People", kind: NAMED_PEOPLE},
    {label: "Relays", kind: NAMED_RELAYS},
    {label: "Topics", kind: NAMED_TOPICS},
  ])

  const onKindChange = kind => {
    list.kind = kind
    list.tags = []
  }

  const onPubkeysChange = pubkeys => {
    list.tags = pubkeys.map(tagPubkey)
  }

  const onRelaysChange = urls => {
    list.tags = urls.map(url => ["r", url])
  }

  const onTopicsChange = topics => {
    list.tags = topics.map(topic => ["t", topic])
  }

  let deleteIsOpen = false
</script>

<form on:submit|preventDefault={submit}>
  <FlexColumn>
    <Field label="Name">
      <Input bind:value={list.title} placeholder="My list" />
      <p slot="info">Lists are identified by their name, so this has to be unique.</p>
    </Field>
    <Field label="Description">
      <Input bind:value={list.description} placeholder="About my list" />
      <p slot="info">A brief description of what is in this list.</p>
    </Field>
    {#if !hide.includes("type")}
      <Field label="List type">
        <SearchSelect search={kindsHelper.searchValues} value={list.kind} onChange={onKindChange}>
          <div slot="item" let:item>{kindsHelper.displayValue(item)}</div>
        </SearchSelect>
      </Field>
    {/if}
    {#if !hide.includes("tags")}
      <Field label="List contents">
        {#if list.kind === NAMED_PEOPLE}
          <PersonSelect
            multiple
            value={Tags.wrap(list.tags).whereKey("p").values().valueOf()}
            onChange={onPubkeysChange} />
        {:else if list.kind === NAMED_RELAYS}
          <SearchSelect
            multiple
            value={Tags.wrap(list.tags).whereKey("r").values().valueOf()}
            search={$relaySearch.searchValues}
            termToItem={normalizeRelayUrl}
            onChange={onRelaysChange}>
            <span slot="item" let:item>{displayRelayUrl(item)}</span>
          </SearchSelect>
        {:else if list.kind === NAMED_TOPICS}
          <SearchSelect
            multiple
            value={Tags.wrap(list.tags).whereKey("t").values().valueOf()}
            search={$topicSearch.searchValues}
            termToItem={identity}
            onChange={onTopicsChange}>
            <span slot="item" let:item>#{item}</span>
          </SearchSelect>
        {:else}
          <p>Sorry, editing kind ${list.kind} lists isn't currently supported.</p>{/if}
      </Field>
    {/if}
    <div class="flex justify-between">
      <Anchor button on:click={() => exit()}>Discard</Anchor>
      {#if showDelete}
        <Anchor button on:click={openDelete}>Delete</Anchor>
      {/if}
      <Anchor button accent tag="button" type="submit">Save</Anchor>
    </div>
  </FlexColumn>
</form>

{#if deleteIsOpen}
  <Modal onEscape={closeDelete}>
    <Subheading>Confirm deletion</Subheading>
    <p>
      Are you sure you want to delete your {displayList(list)} list?
    </p>
    <div class="flex justify-between gap-2">
      <Anchor button on:click={closeDelete}>Cancel</Anchor>
      <Anchor button danger on:click={confirmDelete}>Confirm</Anchor>
    </div>
  </Modal>
{/if}
