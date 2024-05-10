<script lang="ts">
  import {identity} from "@welshman/lib"
  import {Tags, NAMED_PEOPLE, NAMED_RELAYS, NAMED_TOPICS} from "@welshman/util"
  import {showInfo} from "src/partials/Toast.svelte"
  import Subheading from "src/partials/Subheading.svelte"
  import Field from "src/partials/Field.svelte"
  import PersonBadge from "src/app/shared/PersonBadge.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Input from "src/partials/Input.svelte"
  import SearchSelect from "src/partials/SearchSelect.svelte"
  import {router} from "src/app/util/router"
  import {
    hints,
    mention,
    searchPubkeys,
    displayPubkey,
    displayRelayUrl,
    searchRelayUrls,
    searchTopicNames,
    createAndPublish,
  } from "src/engine"
  import {KindSearch, createList, editList} from 'src/domain'

  export let list
  export let exit

  const submit = async () => {
    const relays = hints.WriteRelays().getUrls()
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
    list.tags = pubkeys.map(mention)
  }

  const onRelaysChange = urls => {
    list.tags = urls.map(url => ["r", url])
  }

  const onTopicsChange = topics => {
    list.tags = topics.map(topic => ["t", topic])
  }
</script>

<form on:submit|preventDefault={submit}>
  <FlexColumn>
    <Subheading class="text-center">Manage list</Subheading>
    <Field label="Name">
      <Input bind:value={list.title} placeholder="My list" />
      <p slot="info">Lists are identified by their name, so this has to be unique.</p>
    </Field>
    <Field label="Description">
      <Input bind:value={list.description} placeholder="About my list" />
      <p slot="info">A brief description of what is in this list.</p>
    </Field>
    <Field label="List type">
      <SearchSelect multiple search={kindsHelper.search} value={list.kind} onChange={onKindChange}>
        <div slot="item" let:item>{kindsHelper.display(item)}</div>
      </SearchSelect>
    </Field>
    {#if list.kind === NAMED_PEOPLE}
      <SearchSelect
        multiple
        value={Tags.from(list.tags).whereKey("p").values().valueOf()}
        search={$searchPubkeys}
        onChange={onPubkeysChange}>
        <span slot="item" let:item let:context>
          {#if context === "value"}
            <Anchor modal href={router.at("people").of(item).toString()}>
              {displayPubkey(item)}
            </Anchor>
          {:else}
            <PersonBadge inert pubkey={item} />
          {/if}
        </span>
      </SearchSelect>
    {:else if list.kind === NAMED_RELAYS}
      <SearchSelect
        multiple
        value={Tags.from(list.tags).whereKey("r").values().valueOf()}
        search={$searchRelayUrls}
        termToItem={identity}
        onChange={onRelaysChange}>
        <span slot="item" let:item>{displayRelayUrl(item)}</span>
      </SearchSelect>
    {:else if list.kind === NAMED_TOPICS}
      <SearchSelect
        multiple
        value={Tags.from(list.tags).whereKey("t").values().valueOf()}
        search={$searchTopicNames}
        termToItem={identity}
        onChange={onTopicsChange}>
        <span slot="item" let:item>#{item}</span>
      </SearchSelect>
    {:else}
      <p>Sorry, editing kind ${list.kind} lists isn't currently supported.
    {/if}
    <div class="flex justify-between">
      <Anchor button on:click={exit}>Discard</Anchor>
      <Anchor button accent tag="button" type="submit">Save</Anchor>
    </div>
  </FlexColumn>
</form>
