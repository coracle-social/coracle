<script lang="ts">
  import {sleep} from "hurdak"
  import {error} from "src/util/logger"
  import {appName, toast, modal} from "src/partials/state"
  import Field from "src/partials/Field.svelte"
  import Input from "src/partials/Input.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Content from "src/partials/Content.svelte"
  import Heading from "src/partials/Heading.svelte"
  import type {Event} from "src/engine"
  import {_events, EventKind, projections} from "src/engine"

  const encryptedKinds = [EventKind.Nip04Message, EventKind.GiftWrap]

  const setFile = e => {
    file = e.target.files[0]
  }

  const submit = () => {
    if (!file) {
      toast.show("error", "Please select a file to import.")

      return
    }

    loading = true

    toast.show("info", "Processing your import...", 60_000)

    const reader = new FileReader()

    reader.onload = async loadEvent => {
      try {
        const data = new Uint8Array(loadEvent.target.result as ArrayBuffer)
        const jsonl = new TextDecoder().decode(data)
        const newEvents = jsonl.split("\n").map(l => JSON.parse(l)) as Event[]

        for (const event of newEvents) {
          event.seen_on = event.seen_on || []

          projections.push(event)

          if (!encryptedKinds.includes(event.kind)) {
            _events.key(event.id).set(event)
          }
        }

        while (projections.buffer.length > 0) {
          await sleep(100)
        }

        toast.show("info", "Import complete!")

        setTimeout(() => modal.pop(), 2000)
      } catch (e) {
        error(e)

        toast.show("error", "Something went wrong!")
      }

      loading = false
    }

    reader.readAsArrayBuffer(file)
  }

  let loading, file
</script>

<form on:submit|preventDefault={submit}>
  <Content>
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
      <Anchor {loading} tag="button" theme="button" type="submit" class="text-center"
        >Import</Anchor>
    </div>
  </Content>
</form>
