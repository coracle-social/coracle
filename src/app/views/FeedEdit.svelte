<script>
  import {when, find, pluck, always, propEq} from "ramda"
  import {randomId} from "hurdak/lib/hurdak"
  import {displayPerson} from "src/util/nostr"
  import {modal, toast} from "src/partials/state"
  import Heading from "src/partials/Heading.svelte"
  import Content from "src/partials/Content.svelte"
  import Button from "src/partials/Button.svelte"
  import Input from "src/partials/Input.svelte"
  import MultiSelect from "src/partials/MultiSelect.svelte"
  import {searchTopics, searchPeople, searchRelays, getPersonWithFallback} from "src/agent/db"
  import user from "src/agent/user"

  export let feed = {}

  let values = {
    id: feed.id,
    name: feed.name,
    params: (feed.authors || [])
      .map(pubkey => ({pubkey}))
      .concat((feed.topics || []).map(name => ({name})))
      .concat((feed.relays || []).map(url => ({url}))),
  }

  const {feeds} = user

  const search = q => {
    if (q.startsWith("~")) {
      console.log($searchRelays(q))
      return $searchRelays(q)
    }

    if (q.startsWith("#")) {
      return $searchTopics(q)
    }

    return $searchPeople(q)
  }

  const submit = () => {
    if (!values.name) {
      return toast.show("error", "A name is required for your feed")
    }

    if (find(f => f.id !== values.id && f.name === values.name, $feeds)) {
      return toast.show("error", "That name is already in use")
    }

    const data = {
      ...values,
      authors: values.authors.length > 0 ? pluck("pubkey", values.authors) : null,
      topics: values.topics.length > 0 ? pluck("name", values.topics) : null,
      relays: values.relays.length > 0 ? pluck("url", values.relays) : null,
    }

    if (!data.id) {
      user.addFeed({id: randomId(), ...data})
    } else {
      user.updateFeeds($feeds => $feeds.map(when(propEq("id", data.id), always(data))))
    }

    toast.show("info", "Your feed has been saved!")
    modal.pop()
  }
</script>

<form on:submit|preventDefault={submit}>
  <Content>
    <Heading class="text-center">{values.id ? "Edit" : "Add"} custom feed</Heading>
    <div class="flex w-full flex-col gap-8">
      <div class="flex flex-col gap-1">
        <strong>Name</strong>
        <Input bind:value={values.name} placeholder="My custom feed" />
        <p class="text-sm text-gray-4">
          Custom feeds are identified by their name, so this has to be unique.
        </p>
      </div>
      <div class="flex flex-col gap-1">
        <strong>Filters</strong>
        <MultiSelect {search} bind:value={values.params}>
          <div slot="item" let:item>
            {#if item.pubkey}
              {displayPerson(getPersonWithFallback(item.pubkey))}
            {:else if item.name}
              #{item.name}
            {:else if item.url}
              {item.url}
            {/if}
          </div>
        </MultiSelect>
        <p class="text-sm text-gray-4">
          Type "@" to look for people, "#" to look for topics, and "~" to look for relays. Custom
          feeds will search for notes that match any item within each filter.
        </p>
      </div>
      <Button type="submit" class="text-center">Save</Button>
    </div>
  </Content>
</form>
