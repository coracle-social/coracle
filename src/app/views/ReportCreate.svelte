<script lang="ts">
  import {identity} from "ramda"
  import {seconds} from "hurdak"
  import {now} from "@coracle.social/lib"
  import {fuzzy} from "src/util/misc"
  import {toast} from "src/partials/state"
  import Heading from "src/partials/Heading.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Field from "src/partials/Field.svelte"
  import SearchSelect from "src/partials/SearchSelect.svelte"
  import {router} from "src/app/router"
  import {publishReport} from "src/engine"

  export let eid
  export let pubkey

  const searchContentWarnings = fuzzy(["nudity", "profanity", "illegal", "spam", "impersonation"])

  const submit = () => {
    const tags = [
      ["p", pubkey],
      ["expiration", String(now() + seconds(7, "day"))],
    ]

    if (flags.length > 0) {
      for (const flag of flags) {
        tags.push(["e", eid, flag])
      }
    }

    publishReport("", tags)
    toast.show("info", "Your report has been sent!")
    router.pop()
  }

  let flags = []
</script>

<form on:submit|preventDefault={submit}>
  <FlexColumn>
    <Heading class="text-center">File a Report</Heading>
    <div class="flex w-full flex-col gap-8">
      <Field label="Content Warnings">
        <SearchSelect
          multiple
          autofocus
          search={searchContentWarnings}
          bind:value={flags}
          termToItem={identity}>
          <div slot="item" let:item>
            <strong>{item}</strong>
          </div>
        </SearchSelect>
        <div slot="info">Flag this content as sensitive so other people can avoid it.</div>
      </Field>
      <Anchor button tag="button" type="submit">Save</Anchor>
    </div>
  </FlexColumn>
</form>
