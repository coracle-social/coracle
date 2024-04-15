<script lang="ts">
  import {sleep} from "hurdak"
  import {error} from "src/util/logger"
  import {isGiftWrap} from "src/util/nostr"
  import {appName} from "src/partials/state"
  import {showInfo, showWarning} from "src/partials/Toast.svelte"
  import Field from "src/partials/Field.svelte"
  import Input from "src/partials/Input.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Heading from "src/partials/Heading.svelte"
  import {router} from "src/app/util/router"
  import type {Event} from "src/engine"
  import {_events, projections} from "src/engine"

  const setFile = e => {
    file = e.target.files[0]
  }

  const submit = () => {
    if (!file) {
      showWarning("Please select a file to import.")

      return
    }

    loading = true

    showInfo("Processing your import...", {timeout: 60_000})

    const reader = new FileReader()

    reader.onload = async loadEvent => {
      try {
        const data = new Uint8Array(loadEvent.target.result as ArrayBuffer)
        const jsonl = new TextDecoder().decode(data)
        const newEvents = jsonl.split("\n").map(l => JSON.parse(l)) as Event[]

        for (const event of newEvents) {
          projections.push(event)

          if (!isGiftWrap(event)) {
            _events.key(event.id).set(event)
          }
        }

        while (projections.buffer.length > 0) {
          await sleep(100)
        }

        showInfo("Import complete!")

        setTimeout(() => router.clearModals(), 2000)
      } catch (e) {
        error(e)

        showWarning("Something went wrong!")
      }

      loading = false
    }

    reader.readAsArrayBuffer(file)
  }

  let loading, file
</script>

<form on:submit|preventDefault={submit}>
  <FlexColumn>
    <div class="mb-4 flex flex-col items-center justify-center">
      <Heading>Import Data</Heading>
      <p>Populate {appName}'s database with a nostr export file</p>
    </div>
    <div class="flex w-full flex-col gap-8">
      <Field label="Only export user events">
        <Input type="file" on:change={setFile} accept=".jsonl" />
        <p slot="info">
          Nostr exports are .jsonl files. Some software may compress exports, be sure to upload an
          uncompressed version.
        </p>
      </Field>
      <Anchor {loading} button tag="button" type="submit" class="text-center">Import</Anchor>
    </div>
  </FlexColumn>
</form>
