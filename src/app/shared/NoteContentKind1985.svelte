<script lang="ts">
  import {Tags} from "@welshman/util"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import RelayCard from "src/app/shared/RelayCard.svelte"
  import NoteContentLabel from "src/app/shared/NoteContentLabel.svelte"
  import NoteContentKind1 from "src/app/shared/NoteContentKind1.svelte"

  export let note, showEntire

  const tags = Tags.fromEvent(note)
  const isRelayReview = tags.get("l")?.value() === "review/relay"
  const url = tags.get("r")?.value()
</script>

<FlexColumn>
  {#if !isRelayReview}
    <NoteContentLabel {note} />
  {/if}
  <NoteContentKind1 {note} {showEntire} />
  {#if isRelayReview && url}
    <RelayCard hideRatingsCount {url} ratings={[note]} />
  {/if}
</FlexColumn>
