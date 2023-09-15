<script lang="ts">
  import {without} from "ramda"
  import {
    parseContent,
    getLinks,
    truncateContent,
    LINK,
    INVOICE,
    NEWLINE,
    ELLIPSIS,
    TOPIC,
    TEXT,
  } from "src/util/notes"
  import MediaSet from "src/partials/MediaSet.svelte"
  import QRCode from "src/partials/QRCode.svelte"
  import NoteContentNewline from "src/app/shared/NoteContentNewline.svelte"
  import NoteContentEllipsis from "src/app/shared/NoteContentEllipsis.svelte"
  import NoteContentTopic from "src/app/shared/NoteContentTopic.svelte"
  import NoteContentLink from "src/app/shared/NoteContentLink.svelte"
  import NoteContentPerson from "src/app/shared/NoteContentPerson.svelte"
  import NoteContentQuote from "src/app/shared/NoteContentQuote.svelte"
  import NoteContentEntity from "src/app/shared/NoteContentEntity.svelte"

  export let note
  export let maxLength = 700
  export let anchorId = false
  export let showEntire = false
  export let showMedia = false
  export let expandable = true

  const fullContent = parseContent(note)
  const shortContent = truncateContent(fullContent, {maxLength, showEntire, showMedia})
  const links = getLinks(shortContent)
  const extraLinks = without(links, getLinks(fullContent))

  export const isNewline = i =>
    !shortContent[i] ||
    shortContent[i].type === NEWLINE ||
    (shortContent[i].type === TEXT && shortContent[i].value.match(/^\s+$/))

  export const isStartOrEnd = i => isNewline(i - 1) || isNewline(i + 1)
</script>

<div class="flex flex-col gap-2 overflow-hidden text-ellipsis">
  <p>
    {#each shortContent as { type, value }, i}
      {#if type === NEWLINE}
        <NoteContentNewline {value} />
      {:else if type === ELLIPSIS}
        {#if expandable}
          <NoteContentEllipsis />
        {/if}
      {:else if type === TOPIC}
        <NoteContentTopic {value} />
      {:else if type === INVOICE}
        <div on:click|stopPropagation>
          <QRCode fullWidth onClick="copy" code={value} />
        </div>
      {:else if type === LINK}
        <NoteContentLink {value} showMedia={showMedia && isStartOrEnd(i)} />
      {:else if type.match(/^nostr:np(rofile|ub)$/)}
        <NoteContentPerson {value} />
      {:else if type.startsWith("nostr:") && showMedia && isStartOrEnd(i) && value.id !== anchorId}
        <NoteContentQuote {note} {value}>
          <div slot="note-content" let:quote>
            <slot name="note-content" {quote} />
          </div>
        </NoteContentQuote>
      {:else if type.startsWith("nostr:")}
        <NoteContentEntity {value} />
      {:else}
        {value}
      {/if}
      {" "}
    {/each}
  </p>
  {#if showMedia && extraLinks.length > 0}
    <MediaSet links={extraLinks} />
  {/if}
</div>
