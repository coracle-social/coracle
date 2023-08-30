<script>
  import {identity} from "ramda"
  import {fuzzy} from "src/util/misc"
  import {modal, toast} from "src/partials/state"
  import Heading from "src/partials/Heading.svelte"
  import Content from "src/partials/Content.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Field from "src/partials/Field.svelte"
  import MultiSelect from "src/partials/MultiSelect.svelte"
  import engine, {Builder, Outbox, user} from "src/app/engine"

  export let note

  const {searchTopics} = engine.Content

  const searchContentWarnings = fuzzy(["nudity", "profanity", "illegal", "spam", "impersonation"])

  const submit = () => {
    const tags = [["e", note.id]]

    if (topics.length > 0) {
      tags.push(["L", "#t"])

      for (const topic of topics) {
        tags.push(["l", topic.name, "#t"])
      }
    }

    if (flags.length > 0) {
      tags.push(["L", "content-warning"])

      for (const flag of flags) {
        tags.push(["l", flag, "content-warning"])
      }
    }

    Outbox.publish({
      event: Builder.createLabel({tagClient: false, tags}),
      relays: user.getRelayUrls("write"),
    })

    toast.show("info", "Your curation has been saved!")
    modal.pop()
  }

  let topics = []
  let flags = []
</script>

<form on:submit|preventDefault={submit}>
  <Content>
    <Heading class="text-center">Add Labels</Heading>
    <div class="flex w-full flex-col gap-8">
      <Field label="Topics" info="Associate this content with topics so other people can find it">
        <MultiSelect search={$searchTopics} bind:value={topics} termToItem={name => ({name})}>
          <div slot="item" let:item>
            <strong>#{item.name}</strong>
          </div>
        </MultiSelect>
      </Field>
      <Field
        label="Content Warnings"
        info="Flag this content as sensitive so other people can avoid it">
        <MultiSelect search={searchContentWarnings} bind:value={flags} termToItem={identity}>
          <div slot="item" let:item>
            <strong>{item}</strong>
          </div>
        </MultiSelect>
      </Field>
      <Anchor tag="button" theme="button" type="submit" class="text-center">Save</Anchor>
    </div>
  </Content>
</form>
