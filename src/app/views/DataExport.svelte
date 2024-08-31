<script lang="ts">
  import {repository, pubkey, handlesByPubkey} from "@welshman/app"
  import FieldInline from "src/partials/FieldInline.svelte"
  import Toggle from "src/partials/Toggle.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Heading from "src/partials/Heading.svelte"

  const submit = async () => {
    const events = Array.from(repository.query([userOnly ? {authors: [$pubkey]} : {}]))
    const jsonl = events
      .filter(e => includeEncrypted || (!e.wrap && e.kind !== 4))
      // Important: re-wrap encrypted messages
      .map(e => JSON.stringify(e.wrap || e))
      .join("\n")

    const filename = $handlesByPubkey.get($pubkey)?.nip05 || $pubkey.slice(0, 16)
    const data = new TextEncoder().encode(jsonl)
    const blob = new Blob([data], {type: "application/octet-stream"})
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")

    a.href = url
    a.download = `${filename}.jsonl`
    a.click()

    URL.revokeObjectURL(url)
  }

  let userOnly = true
  let includeEncrypted = false
</script>

<form on:submit|preventDefault={submit}>
  <FlexColumn>
    <div class="mb-4 flex flex-col items-center justify-center">
      <Heading>Export Settings</Heading>
      <p>Select which events you'd like to export</p>
    </div>
    <div class="flex w-full flex-col gap-8">
      <FieldInline label="Only export user events">
        <Toggle bind:value={userOnly} />
        <p slot="info">If enabled, only your events will be exported.</p>
      </FieldInline>
      <FieldInline label="Include encrypted events">
        <Toggle bind:value={includeEncrypted} />
        <p slot="info">
          If enabled, encrypted DMs and wrapped events will be exported. The events will remain
          encrypted, so this will not reduce security.
        </p>
      </FieldInline>
      <Anchor button tag="button" type="submit">Export</Anchor>
    </div>
  </FlexColumn>
</form>
