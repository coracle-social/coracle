<script>
  import {when, find, objOf, pluck, always, propEq} from "ramda"
  import {randomId} from "hurdak/lib/hurdak"
  import {modal, toast} from "src/partials/state"
  import Heading from "src/partials/Heading.svelte"
  import Content from "src/partials/Content.svelte"
  import Button from "src/partials/Button.svelte"
  import Input from "src/partials/Input.svelte"
  import MultiSelect from "src/partials/MultiSelect.svelte"
  import PersonBadge from "src/app/shared/PersonBadge.svelte"
  import {searchTopics, searchPeople, searchRelays, getPersonWithFallback} from "src/agent/db"
  import user from "src/agent/user"

  export let feed = {}

  let values = {
    id: feed.id,
    name: feed.name,
    authors: (feed.authors || []).map(objOf("pubkey")),
    topics: (feed.topics || []).map(objOf("name")),
    relays: (feed.relays || []).map(objOf("url")),
  }

  const {feeds} = user

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
        <strong>Feed name</strong>
        <Input bind:value={values.name} placeholder="My custom feed" />
        <p class="text-sm text-gray-4">
          Custom feeds are identified by their name, so this has to be unique.
        </p>
      </div>
      <div class="flex flex-col gap-1">
        <strong>Limit by author</strong>
        <MultiSelect
          search={$searchPeople}
          bind:value={values.authors}
          placeholder="A list of authors">
          <div slot="item" let:item>
            <PersonBadge inert person={getPersonWithFallback(item.pubkey)} />
          </div>
        </MultiSelect>
        <p class="text-sm text-gray-4">
          Only notes by the given authors will be shown in the feed.
        </p>
      </div>
      <div class="flex flex-col gap-1">
        <strong>Limit by topic</strong>
        <MultiSelect
          search={$searchTopics}
          bind:value={values.topics}
          delimiters={[",", " "]}
          termToItem={objOf("name")}
          placeholder="A list of topics">
          <div slot="item" let:item>
            #{item.name}
          </div>
        </MultiSelect>
        <p class="text-sm text-gray-4">
          Only notes with the given topics will be shown in the feed.
        </p>
      </div>
      <div class="flex flex-col gap-1">
        <strong>Limit by relay</strong>
        <MultiSelect
          search={$searchRelays}
          bind:value={values.relays}
          delimiters={[",", " "]}
          termToItem={objOf("url")}
          placeholder="A list of relays">
          <div slot="item" let:item>
            {item.url}
          </div>
        </MultiSelect>
        <p class="text-sm text-gray-4">
          Only notes found on the given relays will be shown in the feed.
        </p>
      </div>
      <Button type="submit" class="text-center">Save</Button>
    </div>
  </Content>
</form>
