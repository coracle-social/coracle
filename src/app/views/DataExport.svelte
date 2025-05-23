<script lang="ts">
  import {repository, pubkey, profilesByPubkey} from "@welshman/app"
  import {Capacitor} from "@capacitor/core"
  import {Filesystem, Directory, Encoding} from "@capacitor/filesystem"
  import FieldInline from "src/partials/FieldInline.svelte"
  import Toggle from "src/partials/Toggle.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Heading from "src/partials/Heading.svelte"
  import {showInfo} from "src/partials/Toast.svelte"

  let userOnly = true
  let includeEncrypted = false

  const downloadNative = async (filename, jsonl) => {
    try {
      const permissionStatus = await Filesystem.checkPermissions()

      if (permissionStatus.publicStorage !== "granted") {
        await Filesystem.requestPermissions()
      }

      await Filesystem.writeFile({
        path: `${filename}.jsonl`,
        data: jsonl,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      })

      showInfo(`File saved to your documents folder as ${filename}.jsonl`)
    } catch (error) {
      console.error("Error saving file:", error)
      showInfo("Error saving file. Please try again.")
    }
  }

  const downloadWeb = (filename, jsonl) => {
    const data = new TextEncoder().encode(jsonl)
    const blob = new Blob([data], {type: "application/octet-stream"})
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")

    a.href = url
    a.download = `${filename}.jsonl`
    a.click()

    URL.revokeObjectURL(url)
  }

  const submit = async () => {
    const filename = $profilesByPubkey.get($pubkey)?.nip05 || $pubkey.slice(0, 16)
    const events = Array.from(repository.query([userOnly ? {authors: [$pubkey]} : {}]))
    const jsonl = events
      .filter(e => includeEncrypted || (!e.wrap && e.kind !== 4))
      // Important: re-wrap encrypted messages
      .map(e => JSON.stringify(e.wrap || e))
      .join("\n")

    if (Capacitor.isNativePlatform()) {
      downloadNative(filename, jsonl)
    } else {
      downloadWeb(filename, jsonl)
    }
  }
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
