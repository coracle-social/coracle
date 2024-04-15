<script lang="ts">
  import {Tags, decodeAddress} from "@coracle.social/util"
  import {randomId} from "hurdak"
  import {showInfo, showWarning} from "src/partials/Toast.svelte"
  import Heading from "src/partials/Heading.svelte"
  import Field from "src/partials/Field.svelte"
  import PersonBadge from "src/app/shared/PersonBadge.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Input from "src/partials/Input.svelte"
  import SearchSelect from "src/partials/SearchSelect.svelte"
  import {router} from "src/app/util/router"
  import {
    env,
    userLists,
    searchPeople,
    searchTopics,
    searchRelays,
    displayPubkey,
    displayRelay,
    publishBookmarksList,
  } from "src/engine"

  export let list = null
  export let address = null

  if (!list && address) {
    list = userLists.key(address).get()
  }

  const tags = list ? Tags.fromEvent(list) : Tags.from([])

  const values = {
    title: tags.get("title")?.value() || tags.get("name")?.value() || tags.get("d")?.value() || "",
    description: tags.get("description")?.value() || "",
    params: tags.filter(t => ["t", "p"].includes(t.key())).unwrap(),
    relays: tags.whereValue("r").unwrap(),
  }

  const search = q => {
    if (q.startsWith("#")) {
      return $searchTopics(q)
        .slice(0, 5)
        .map(({name}) => ["t", name])
    }

    return $searchPeople(q)
      .slice(0, 5)
      .map(({pubkey}) => ["p", pubkey])
  }

  const searchRelayTags = q => $searchRelays(q).map(r => ["r", r.url])

  const submit = () => {
    if (!values.title) {
      return showWarning("A name is required for your list")
    }

    const duplicates = $userLists.filter(l => l.title === values.title && l.address !== address)

    if (duplicates.length > 0) {
      return showWarning("That name is already in use")
    }

    const id = address ? decodeAddress(address).identifier : randomId()
    const {title, description, params, relays} = values

    publishBookmarksList(id, title, description, [...params, ...relays])
    showInfo("Your list has been saved!")
    router.pop()
  }
</script>

<form on:submit|preventDefault={submit}>
  <FlexColumn>
    <Heading class="text-center">{address ? "Edit" : "Add"} list</Heading>
    <div class="flex w-full flex-col gap-8">
      <Field label="Name">
        <Input bind:value={values.title} placeholder="My list" />
        <p slot="info">Lists are identified by their name, so this has to be unique.</p>
      </Field>
      <Field label="Description">
        <Input bind:value={values.description} placeholder="About my list" />
        <p slot="info">A brief description of what is in this list.</p>
      </Field>
      <Field label="Topics and People">
        <SearchSelect multiple {search} bind:value={values.params}>
          <div slot="item" let:item let:context>
            {#if item[0] === "p"}
              {#if context === "value"}
                {displayPubkey(item[1])}
              {:else}
                <PersonBadge inert pubkey={item[1]} />
              {/if}
            {:else}
              <strong>#{item[1]}</strong>
            {/if}
          </div>
        </SearchSelect>
        <p slot="info">Type "@" to look for people, and "#" to look for topics.</p>
      </Field>
      {#if $env.PLATFORM_RELAYS.length === 0}
        <Field label="Relays">
          <SearchSelect multiple search={searchRelayTags} bind:value={values.relays}>
            <div slot="item" let:item>
              {displayRelay({url: item[1]})}
            </div>
          </SearchSelect>
          <p slot="info">
            Select which relays to limit this list to. If you leave this blank, your default relays
            will be used.
          </p>
        </Field>
      {/if}
      <Anchor button tag="button" type="submit">Save</Anchor>
    </div>
  </FlexColumn>
</form>
