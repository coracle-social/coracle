<script lang="ts">
  import {Tags} from "src/util/nostr"
  import {urlIsMedia} from "src/util/notes"
  import Card from "src/partials/Card.svelte"
  import Chip from "src/partials/Chip.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Content from "src/partials/Content.svelte"
  import NoteContentLink from "src/app/shared/NoteContentLink.svelte"
  import NoteContentTopics from "src/app/shared/NoteContentTopics.svelte"
  import PersonBadge from "src/app/shared/PersonBadge.svelte"
  import {Naddr} from "src/engine"

  export let note
  export let showMedia = false

  const tags = Tags.from(note)
  const naddr = Naddr.fromEvent(note).encode()
  const {title, summary, image, status, p} = tags.asMeta() as Record<string, string>
</script>

<Anchor external href={`https://zap.stream/${naddr}`}>
  <Card interactive>
    <Content class="relative">
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
    </Content>
  </Card>
</Anchor>
