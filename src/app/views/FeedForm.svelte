<script lang="ts">
  import {randomId} from "@welshman/lib"
  import {Kind, getAddress} from "@welshman/util"
  import {makeIntersectionFeed, makeScopeFeed, Scope} from "@welshman/feeds"
  import Card from "src/partials/Card.svelte"
  import Field from "src/partials/Field.svelte"
  import Input from "src/partials/Input.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import FeedField from "src/app/shared/FeedField.svelte"
  import {router} from "src/app/util"
  import {hints, createAndPublish} from "src/engine"

  export let address = null

  const abort = () => router.pop()

  const saveFeed = async () => {
    const pub = await createAndPublish({
      kind: Kind.Feed,
      content: JSON.stringify(feed),
      tags: [
        ["d", randomId()],
        ["name", name],
      ],
      relays: hints.WriteRelays().getUrls(),
    })

    address = getAddress(pub.request.event)
  }

  let name = ""
  let feed = makeIntersectionFeed(makeScopeFeed(Scope.Follows))
</script>

<FeedField bind:feed />
<Card>
  <Field label="What would you like to name this feed?">
    <Input bind:value={name} />
  </Field>
</Card>
<div class="flex justify-between gap-2">
  <Anchor button on:click={abort}>Discard</Anchor>
  <Anchor button accent on:click={saveFeed}>Save</Anchor>
</div>
