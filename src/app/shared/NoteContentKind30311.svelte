<script lang="ts">
  import {fromPairs} from "ramda"
  import {addressToNaddr} from "paravel"
  import {urlIsMedia} from "src/util/notes"
  import Card from "src/partials/Card.svelte"
  import Chip from "src/partials/Chip.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import NoteContentLink from "src/app/shared/NoteContentLink.svelte"
  import NoteContentTopics from "src/app/shared/NoteContentTopics.svelte"
  import PersonBadge from "src/app/shared/PersonBadge.svelte"
  import {hints} from "src/engine"

  export let note
  export let showMedia = false

  const naddr = addressToNaddr(hints.address(note))
  const {title, summary, image, status, p} = fromPairs(note.tags) as Record<string, string>
</script>

<Anchor external href={`https://zap.stream/${naddr}`}>
  <Card interactive>
    <FlexColumn>
      {#if p}
        <PersonBadge pubkey={p} />
      {/if}
      <div class="flex items-center justify-between gap-2">
        <p class="staatliches text-2xl">{title}</p>
        <Chip class="text-sm">
          <i class="fa fa-sm fa-tower-broadcast" />
          {status}
        </Chip>
      </div>
      {#if summary}
        <p>{summary}</p>
      {/if}
      {#if showMedia && image && urlIsMedia(image)}
        <NoteContentLink value={{url: image, isMedia: true}} showMedia />
      {/if}
      <NoteContentTopics {note} />
    </FlexColumn>
  </Card>
</Anchor>
