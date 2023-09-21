<script lang="ts">
  import FieldInline from "src/partials/FieldInline.svelte"
  import Toggle from "src/partials/Toggle.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Content from "src/partials/Content.svelte"
  import Heading from "src/partials/Heading.svelte"
  import {events, user, EventKind} from "src/engine"

  const encryptedKinds = [EventKind.Nip04Message, EventKind.GiftWrap]

  const submit = async () => {
    const jsonl = $events
      .filter(e => {
        if (userOnly && e.pubkey !== $user.pubkey) return false
        if (!includeEncrypted && encryptedKinds.includes(e.kind)) return false

        return true
      })
      // Important: re-wrap encrypted messages
      .map(e => JSON.stringify(e.wrap || e))
      .join("\n")

    const {pubkey, handle} = $user
    const filename = handle?.address || pubkey.slice(0, 16)
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
  <Content>
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
      <Anchor tag="button" theme="button" type="submit" class="text-center">Export</Anchor>
    </div>
  </Content>
</form>
