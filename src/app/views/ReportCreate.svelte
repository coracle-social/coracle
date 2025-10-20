<script lang="ts">
  import {asSignedEvent, makeEvent} from "@welshman/util"
  import type {SignedEvent} from "@welshman/util"
  import {Nip59, Nip01Signer} from "@welshman/signer"
  import {Router} from "@welshman/router"
  import {repository, publishThunk, loadRelaySelections} from "@welshman/app"
  import {showInfo} from "src/partials/Toast.svelte"
  import Heading from "src/partials/Heading.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Button from "src/partials/Button.svelte"
  import Field from "src/partials/Field.svelte"
  import Textarea from "src/partials/Textarea.svelte"
  import PersonLink from "src/app/shared/PersonLink.svelte"
  import FeedItem from "src/app/shared/FeedItem.svelte"
  import {router} from "src/app/util/router"

  export let id

  const event = repository.getEvent(id)

  const tagr = "56d4b3d6310fadb7294b7f041aab469c5ffc8991b1b1b331981b96a246f6ae65"

  const submit = async () => {
    const content = JSON.stringify({
      reporterText: message,
      reportedEvent: asSignedEvent(event as SignedEvent),
    })

    // Don't use our session wrapper so that reports are anonymous
    const template = makeEvent(14, {content})
    const helper = new Nip59(Nip01Signer.ephemeral())
    const wrap = await helper.wrap(tagr, template)

    publishThunk({
      event: wrap,
      relays: Router.get()
        .merge([
          Router.get().FromRelays(["wss://relay.nos.social"]),
          Router.get().PubkeyInbox(tagr),
        ])
        .getUrls(),
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
    <FeedItem note={event} showMedia={false} />
    <Button class="btn" type="submit">Save</Button>
  </FlexColumn>
</form>
