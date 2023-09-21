<script lang="ts">
  import {identity} from "ramda"
  import {seconds} from "hurdak"
  import {fuzzy, now} from "src/util/misc"
  import {modal, toast} from "src/partials/state"
  import Heading from "src/partials/Heading.svelte"
  import Content from "src/partials/Content.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Field from "src/partials/Field.svelte"
  import MultiSelect from "src/partials/MultiSelect.svelte"
  import {publishReport} from "src/engine"

  export let note

  const searchContentWarnings = fuzzy(["nudity", "profanity", "illegal", "spam", "impersonation"])

  const submit = () => {
    const tags = [
      ["p", note.pubkey],
      ["expiration", now() + seconds(7, "day")],
    ]

    if (flags.length > 0) {
      for (const flag of flags) {
        tags.push(["e", note.id, flag])
      }
    }

    publishReport("", tags)
    toast.show("info", "Your report has been sent!")
    modal.pop()
  }

  let flags = []
</script>

<form on:submit|preventDefault={submit}>
  <Content>
    <Heading class="text-center">File a Report</Heading>
    <div class="flex w-full flex-col gap-8">
      <Field label="Content Warnings">
        <MultiSelect
          autofocus
          search={searchContentWarnings}
          bind:value={flags}
          termToItem={identity}>
          <div slot="item" let:item>
            <strong>{item}</strong>
          </div>
        </MultiSelect>
        <div slot="info">Flag this content as sensitive so other people can avoid it.</div>
      </Field>
      <Anchor tag="button" theme="button" type="submit" class="text-center">Save</Anchor>
    </div>
  </Content>
</form>
