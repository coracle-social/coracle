<script lang="ts">
  import {toast} from "src/partials/state"
  import Heading from "src/partials/Heading.svelte"
  import Content from "src/partials/Content.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Field from "src/partials/Field.svelte"
  import SearchSelect from "src/partials/SearchSelect.svelte"
  import {router} from "src/app/router"
  import {publishLabel, searchTopics} from "src/engine"

  export let eid

  const submit = () => {
    const tags = [["e", eid]]

    if (topics.length > 0) {
      tags.push(["L", "#t"])

      for (const topic of topics) {
        tags.push(["l", topic.name, "#t"])
      }
    }

    publishLabel(tags)

    toast.show("info", "Your tag has been saved!")
    router.pop()
  }

  let topics = []
</script>

<form on:submit|preventDefault={submit}>
  <Content>
    <Heading class="text-center">Add Tags</Heading>
    <p class="text-center">
      Recommend content to people who follow you. You can find your recommendations under the
      "Explore" tab.
    </p>
    <div class="flex w-full flex-col gap-8">
      <Field label="Tags">
        <SearchSelect
          multiple
          autofocus
          search={$searchTopics}
          bind:value={topics}
          termToItem={name => ({name})}>
          <div slot="item" let:item>
            <strong>{item.name}</strong>
          </div>
        </SearchSelect>
        <div slot="info">Tag this content so other people can find it.</div>
      </Field>
      <Anchor button tag="button" type="submit">Save</Anchor>
    </div>
  </Content>
</form>
