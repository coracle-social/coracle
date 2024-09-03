<script lang="ts">
  import {asSignedEvent, createEvent} from "@welshman/util"
  import type {SignedEvent} from "@welshman/util"
  import {Nip59, Nip01Signer} from "@welshman/signer"
  import {repository, AppContext, loadRelaySelections} from "@welshman/app"
  import {showInfo} from "src/partials/Toast.svelte"
  import Heading from "src/partials/Heading.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Field from "src/partials/Field.svelte"
  import Textarea from "src/partials/Textarea.svelte"
  import PersonLink from "src/app/shared/PersonLink.svelte"
  import Note from "src/app/shared/Note.svelte"
  import {router} from "src/app/util/router"
  import {publish} from "src/engine"

  export let eid

  const event = repository.getEvent(eid)

  const tagr = "56d4b3d6310fadb7294b7f041aab469c5ffc8991b1b1b331981b96a246f6ae65"

  const submit = async () => {
    const content = JSON.stringify({
      reporterText: message,
      reportedEvent: asSignedEvent(event as SignedEvent),
    })

    // Don't use our session wrapper so that reports are anonymous
    const helper = new Nip59(Nip01Signer.ephemeral())
    const template = createEvent(14, {content})
    const rumor = await helper.wrap(tagr, template)

    publish({
      event: rumor.wrap,
      relays: AppContext.router
        .merge([
          AppContext.router.fromRelays(["wss://relay.nos.social"]),
          AppContext.router.PublishMessage(tagr),
        ])
        .getUrls(),
      forcePlatform: false,
    })

    showInfo("Your report has been sent!")
    router.pop()
  }

  let message = ""

  loadRelaySelections(tagr)
</script>

<form on:submit|preventDefault={submit}>
  <FlexColumn>
    <Heading class="text-center">File a Report</Heading>
    <Field label="Why are you reporting this content?">
      <Textarea bind:value={message} />
      <div slot="info">
        Reports are sent to <PersonLink pubkey={tagr} /> for review. No identifying information is included
        with the report.
      </div>
    </Field>
    <Note note={event} showMedia={false} />
    <Anchor button tag="button" type="submit">Save</Anchor>
  </FlexColumn>
</form>
