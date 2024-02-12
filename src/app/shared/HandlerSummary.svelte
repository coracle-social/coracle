<script lang="ts">
  import {uniq, pluck} from "ramda"
  import {copyToClipboard} from "src/util/html"
  import {tryJson, displayDomain} from "src/util/misc"
  import {toast} from "src/partials/state"
  import Card from "src/partials/Card.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Chip from "src/partials/Chip.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import ImageCircle from "src/partials/ImageCircle.svelte"
  import Subheading from "src/partials/Subheading.svelte"
  import PeopleAction from "src/app/shared/PeopleAction.svelte"
  import type {Event} from "src/engine"

  export let event
  export let recs: Event[] = []

  const meta = tryJson(() => JSON.parse(event.content)) || {}

  const copy = text => {
    copyToClipboard(text)
    toast.show("info", "Copied to clipboard!")
  }
</script>

<Card>
  <FlexColumn>
    <div class="flex gap-3">
      <ImageCircle class="h-10 w-10" src={meta.picture} />
      <Subheading>{meta.display_name}</Subheading>
    </div>
    {#if meta.about}
      <p>{meta.about}</p>
    {/if}
    <div>
      {#if meta.website}
        <Anchor external href={meta.website} class="mb-2 mr-2 inline-block">
          <Chip>
            <i class="fa fa-link" />
            {displayDomain(meta.website)}
          </Chip>
        </Anchor>
      {/if}
      {#if meta.lud16}
        <Chip class="mb-2 mr-2 inline-block cursor-pointer" on:click={() => copy(meta.lud16)}>
          <i class="fa fa-bolt" />
          {meta.lud16}
        </Chip>
      {/if}
      {#if meta.nip05}
        <Chip class="mb-2 mr-2 inline-block cursor-pointer" on:click={() => copy(meta.nip05)}>
          <i class="fa fa-at" />
          {meta.nip05}
        </Chip>
      {/if}
    </div>
    {#if recs.length > 0}
      <PeopleAction pubkeys={uniq(pluck("pubkey", recs))} actionText="recommend this app" />
    {/if}
  </FlexColumn>
</Card>
