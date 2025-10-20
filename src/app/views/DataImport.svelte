<script lang="ts">
  import type {TrustedEvent} from "@welshman/util"
  import {isSignedEvent} from "@welshman/util"
  import {repository} from "@welshman/app"
  import {error} from "src/util/logger"
  import {appName} from "src/partials/state"
  import {showInfo, showWarning} from "src/partials/Toast.svelte"
  import Field from "src/partials/Field.svelte"
  import Button from "src/partials/Button.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Heading from "src/partials/Heading.svelte"
  import {router} from "src/app/util/router"

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
        const jsonl = new TextDecoder().decode(data).split("\n")
        const newEvents: TrustedEvent[] = []

        for (let i = 0; i < jsonl.length; i++) {
          const l = jsonl[i]

          if (l) {
            try {
              newEvents.push(JSON.parse(l))
            } catch (e) {
              showInfo(`Failed to parse row #${i}`)
              loading = false
              return
            }
          }
        }

        for (const event of newEvents) {
          if (isSignedEvent(event)) {
            repository.publish(event)
          }
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
      <Field label="">
        <input type="file" on:change={setFile} accept=".jsonl" />
        <p slot="info">
          Nostr exports are .jsonl files. Some software may compress exports, be sure to upload an
          uncompressed version.
        </p>
      </Field>
      <Button {loading} class="btn text-center" type="submit">Import</Button>
    </div>
  </FlexColumn>
</form>
