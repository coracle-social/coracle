<script lang="ts">
  import {without} from "ramda"
  import {
    parse,
    truncate,
    render as renderParsed,
    isText,
    isTopic,
    isCode,
    isCashu,
    isInvoice,
    isLink,
    isProfile,
    isEvent,
    isEllipsis,
    isAddress,
    isNewline,
  } from "@welshman/content"
  import MediaSet from "src/partials/MediaSet.svelte"
  import QRCode from "src/partials/QRCode.svelte"
  import NoteContentNewline from "src/app/shared/NoteContentNewline.svelte"
  import NoteContentEllipsis from "src/app/shared/NoteContentEllipsis.svelte"
  import NoteContentTopic from "src/app/shared/NoteContentTopic.svelte"
  import NoteContentCode from "src/app/shared/NoteContentCode.svelte"
  import NoteContentLink from "src/app/shared/NoteContentLink.svelte"
  import PersonLink from "src/app/shared/PersonLink.svelte"
  import NoteContentQuote from "src/app/shared/NoteContentQuote.svelte"

  export let note
  export let minLength = 500
  export let maxLength = 700
  export let showEntire = false
  export let showMedia = false
  export let skipMedia = false
  export let expandable = true
  export let depth = 0

  const fullContent = parse(note)

  const expand = () => {
    showEntire = true
  }

  const isBoundary = i => {
    const parsed = shortContent[i]

    if (!parsed || isBoundary(parsed)) return true
    if (isText(parsed)) return parsed.value.match(/^\s+$/)

    return false
  }

  const isStartOrEnd = i => Boolean(isBoundary(i - 1) || isBoundary(i + 1))

  const getLinks = content =>
    content.filter(x => isLink(x) && x.value.isMedia).map(x => x.value.url.toString())

  $: shortContent = showEntire
    ? fullContent
    : truncate(
        fullContent.filter(p => !skipMedia || (isLink(p) && p.value.isMedia)),
        {
          minLength,
          maxLength,
          mediaLength: showMedia ? 200 : 50,
        },
      )

  $: links = getLinks(shortContent)
  $: extraLinks = without(links, getLinks(fullContent))
  $: ellipsize = expandable && shortContent.find(isEllipsis)
</script>

<div
  class="flex flex-col gap-2 overflow-hidden text-ellipsis"
  style={ellipsize && "mask-image: linear-gradient(0deg, transparent 0px, black 100px)"}>
  <div>
    {#each shortContent as parsed, i}
      {#if isNewline(parsed)}
        <NoteContentNewline value={parsed.value} />
      {:else if isTopic(parsed)}
        <NoteContentTopic value={parsed.value} />
      {:else if isCode(parsed)}
        <NoteContentCode value={parsed.value} />
      {:else if isCashu(parsed)}
        <div on:click|stopPropagation>
          <QRCode copyOnClick code={parsed.value} />
        </div>
      {:else if isInvoice(parsed)}
        <div on:click|stopPropagation>
          <QRCode copyOnClick code={parsed.value} />
        </div>
      {:else if isLink(parsed)}
        <NoteContentLink value={parsed.value} showMedia={showMedia && isStartOrEnd(i)} />
      {:else if isProfile(parsed)}
        <PersonLink pubkey={parsed.value.pubkey} />
      {:else if (isEvent(parsed) || isAddress(parsed)) && isStartOrEnd(i) && depth < 2}
        <NoteContentQuote {depth} {note} value={parsed.value}>
          <div slot="note-content" let:quote>
            <slot name="note-content" {quote} />
          </div>
        </NoteContentQuote>
      {:else if !expandable && isEllipsis(parsed)}
        {@html renderParsed(parsed)}
      {:else}
        {@html renderParsed(parsed)}
      {/if}
    {/each}
  </div>
  {#if showMedia && extraLinks.length > 0}
    <MediaSet links={extraLinks} />
  {/if}
</div>

{#if ellipsize}
  <div class:-ml-12={depth > 0}>
    <NoteContentEllipsis on:click={expand} />
  </div>
{/if}
