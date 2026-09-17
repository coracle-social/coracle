<script lang="ts">
  import {first, identity} from "@welshman/lib"
  import {
    hexTags,
    relayTags,
    tagValues,
    topicTags,
    NAMED_PEOPLE,
    NAMED_RELAYS,
    NAMED_TOPICS,
    normalizeRelayUrl,
    displayRelayUrl,
  } from "@welshman/util"
  import {showInfo} from "src/partials/Toast.svelte"
  import Field from "src/partials/Field.svelte"
  import Modal from "src/partials/Modal.svelte"
  import Subheading from "src/partials/Subheading.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Button from "src/partials/Button.svelte"
  import Input from "src/partials/Input.svelte"
  import SearchSelect from "src/partials/SearchSelect.svelte"
  import PersonSelect from "src/app/shared/PersonSelect.svelte"
  import {command, getWriteRelays, profiles, relaySearch, topicSearch} from "src/engine/core"
  import {deleteEvent} from "src/engine"
  import {makeKindSearch, displayUserList, userListWriter} from "src/domain"

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
    const eventCommand = await command(userListWriter(list))
    const thunk = eventCommand.publish()

    showInfo("Your list has been saved!")
    exit(thunk.options.event)
  }

  const kindsHelper = makeKindSearch([
    {label: "People", kind: NAMED_PEOPLE},
    {label: "Relays", kind: NAMED_RELAYS},
    {label: "Topics", kind: NAMED_TOPICS},
  ])

  const onKindChange = kind => {
    list.kind = kind
    list.tags = []
  }

  const makePersonTag = (pubkey: string) => [
    "p",
    pubkey,
    first(getWriteRelays(pubkey)) || "",
    $profiles.display(pubkey).get(),
  ]

  const onPubkeysChange = pubkeys => {
    list.tags = pubkeys.map(makePersonTag)
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
            value={tagValues(hexTags("p"), list.tags)}
            onChange={onPubkeysChange} />
        {:else if list.kind === NAMED_RELAYS}
          <SearchSelect
            multiple
            value={tagValues(relayTags(["r", "relay"]), list.tags)}
            search={$relaySearch.searchValues}
            termToItem={normalizeRelayUrl}
            onChange={onRelaysChange}>
            <span slot="item" let:item>{displayRelayUrl(item)}</span>
          </SearchSelect>
        {:else if list.kind === NAMED_TOPICS}
          <SearchSelect
            multiple
            value={tagValues(topicTags("t"), list.tags)}
            search={$topicSearch.searchValues}
            termToItem={identity}
            onChange={onTopicsChange}>
            <span slot="item" let:item>#{item}</span>
          </SearchSelect>
        {:else}
          <p>Sorry, editing kind {list.kind} lists isn't currently supported.</p>{/if}
      </Field>
    {/if}
    <div class="flex justify-between">
      <Button class="btn" on:click={() => exit()}>Discard</Button>
      {#if showDelete}
        <Button class="btn" on:click={openDelete}>Delete</Button>
      {/if}
      <Button class="btn btn-accent" type="submit">Save</Button>
    </div>
  </FlexColumn>
</form>

{#if deleteIsOpen}
  <Modal onEscape={closeDelete}>
    <Subheading>Confirm deletion</Subheading>
    <p>
      Are you sure you want to delete your {displayUserList(list)} list?
    </p>
    <div class="flex justify-between gap-2">
      <Button class="btn" on:click={closeDelete}>Cancel</Button>
      <Button class="btn btn-danger" on:click={confirmDelete}>Confirm</Button>
    </div>
  </Modal>
{/if}
