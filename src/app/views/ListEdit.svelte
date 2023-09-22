<script lang="ts">
  import {Tags} from "src/util/nostr"
  import {modal, toast} from "src/partials/state"
  import Heading from "src/partials/Heading.svelte"
  import PersonBadge from "src/app/shared/PersonBadge.svelte"
  import Content from "src/partials/Content.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Input from "src/partials/Input.svelte"
  import MultiSelect from "src/partials/MultiSelect.svelte"
  import {
    userLists,
    searchPeople,
    searchTopics,
    searchRelays,
    displayPubkey,
    displayRelay,
    publishBookmarksList,
  } from "src/engine"

  export let list

  const tags = Tags.wrap(list?.tags || [])

  let values = {
    name: tags.getMeta("d") || "",
    params: tags.type(["t", "p"]).all(),
    relays: tags.type("r").all(),
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
    if (!values.name) {
      return toast.show("error", "A name is required for your list")
    }

    const duplicates = $userLists.filter(l => l.name === values.name && l.naddr !== list?.naddr)

    if (duplicates.length > 0) {
      return toast.show("error", "That name is already in use")
    }

    const {name, params, relays} = values

    publishBookmarksList(name, [...params, ...relays])
    toast.show("info", "Your list has been saved!")
    modal.pop()
  }
</script>

<form on:submit|preventDefault={submit}>
  <Content>
    <Heading class="text-center">{list?.naddr ? "Edit" : "Add"} list</Heading>
    <div class="flex w-full flex-col gap-8">
      <div class="flex flex-col gap-1">
        <strong>Name</strong>
        <Input bind:value={values.name} placeholder="My list" />
        <p class="text-sm text-gray-4">
          Lists are identified by their name, so this has to be unique.
        </p>
      </div>
      <div class="flex flex-col gap-1">
        <strong>Topics and People</strong>
        <MultiSelect {search} bind:value={values.params}>
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
        </MultiSelect>
        <p class="text-sm text-gray-4">Type "@" to look for people, and "#" to look for topics.</p>
      </div>
      <div class="flex flex-col gap-1">
        <strong>Relays</strong>
        <MultiSelect search={searchRelayTags} bind:value={values.relays}>
          <div slot="item" let:item>
            {displayRelay({url: item[1]})}
          </div>
        </MultiSelect>
        <p class="text-sm text-gray-4">
          Select which relays to limit this list to. If you leave this blank, your default relays
          will be used.
        </p>
      </div>
      <Anchor tag="button" theme="button" type="submit" class="text-center">Save</Anchor>
    </div>
  </Content>
</form>
