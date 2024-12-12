<script lang="ts">
  import {fromPairs} from "ramda"
  import {Address} from "@welshman/util"
  import {urlIsMedia} from "@welshman/content"
  import {ctx} from "@welshman/lib"
  import Card from "src/partials/Card.svelte"
  import Chip from "src/partials/Chip.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import NoteContentLink from "src/app/shared/NoteContentLink.svelte"
  import NoteContentTopics from "src/app/shared/NoteContentTopics.svelte"
  import PersonBadge from "src/app/shared/PersonBadge.svelte"

  export let note
  export let showMedia = false

  const address = Address.fromEvent(note, ctx.app.router.Event(note).getUrls())
  const {title, summary, image, status, p} = fromPairs(note.tags) as Record<string, string>
</script>

<Anchor external href={`https://zap.stream/${address.toNaddr()}`}>
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
