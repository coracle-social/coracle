<script lang="ts">
  import {Tags} from "@coracle.social/util"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import RelayCard from "src/app/shared/RelayCard.svelte"
  import NoteContentLabel from "src/app/shared/NoteContentLabel.svelte"
  import NoteContentKind1 from "src/app/shared/NoteContentKind1.svelte"
  import {deriveRelay} from "src/engine"

  export let note, maxLength, showEntire

  const tags = Tags.fromEvent(note)
  const isRelayReview = tags.get("l")?.value() === "review/relay"
  const relay = deriveRelay(tags.get("r")?.value())
</script>

<FlexColumn>
  {#if !isRelayReview}
    <NoteContentLabel {note} />
  {/if}
  <NoteContentKind1 {note} {maxLength} {showEntire} />
  {#if isRelayReview && $relay}
    <RelayCard hideRatingsCount relay={$relay} ratings={[note]} />
  {/if}
</FlexColumn>
