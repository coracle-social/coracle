<script lang="ts">
  import cx from "classnames"
  import {fromNostrURI} from "@welshman/util"
  import {
    parse,
    truncate,
    renderAsHtml,
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
    type ParsedLink,
    type Parsed,
  } from "@welshman/content"
  import QRCode from "src/partials/QRCode.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import NoteContentNewline from "src/app/shared/NoteContentNewline.svelte"
  import NoteContentEllipsis from "src/app/shared/NoteContentEllipsis.svelte"
  import NoteContentTopic from "src/app/shared/NoteContentTopic.svelte"
  import NoteContentCode from "src/app/shared/NoteContentCode.svelte"
  import NoteContentLink from "src/app/shared/NoteContentLink.svelte"
  import PersonLink from "src/app/shared/PersonLink.svelte"
  import NoteContentQuote from "src/app/shared/NoteContentQuote.svelte"
  import ImageGrid from "./ImageGrid.svelte"
  import {onMount} from "svelte"

  export let note
  export let minLength = 500
  export let maxLength = 700
  export let showEntire = false
  export let showMedia = false
  export let skipMedia = false
  export let expandable = true
  export let depth = 0

  const expand = () => {
    showEntire = true
  }

  const isBoundary = i => {
    const parsed = shortContent[i]
    if (parsed instanceof Array) return false
    if (!parsed || isNewline(parsed)) return true
    if (isText(parsed)) return Boolean(parsed.value.match(/^\s+$/))

    return false
  }

  const isEnd = i => isBoundary(i + 1)

  const isStartOrEnd = i => isBoundary(i - 1) || isBoundary(i + 1)

  const isBlock = (i: number) => {
    const parsed = fullContent[i]
    if (!parsed) return true
    if (parsed instanceof Array) return showMedia
    if (isLink(parsed)) return showMedia && !parsed.raw.match("^ws|coracle")

    return isEvent(parsed) || isAddress(parsed)
  }

  const isNextToBlock = (i: number) => isBlock(i - 1) || isBlock(i + 1)

  function isImage(parsed: Parsed) {
    return isLink(parsed) && parsed.value.url.toString().match(/\.(jpe?g|png|gif|webp)$/)
  }

  let fullContent: (Parsed | ParsedLink[])[] = []

  onMount(() => {
    let images: ParsedLink[] = []
    let newLines = []
    let emptyText = []
    const parseContent = []
    for (const parsed of parse(note)) {
      if (isImage(parsed)) {
        images.push(parsed as ParsedLink)
      } else {
        if (images.length && isNewline(parsed)) {
          newLines.push(parsed)
        } else if (images.length && isText(parsed) && !parsed.value.trim()) {
          emptyText.push(parsed)
        } else if (images.length) {
          parseContent.push(images)
          if (newLines.length) {
            parseContent.push(newLines[0])
            newLines = []
          } else if (emptyText.length) {
            parseContent.push(emptyText[0])
            emptyText = []
          }
          images = []
        } else {
          parseContent.push(parsed)
        }
      }
    }
    if (images.length) {
      parseContent.push(images)
    }
    fullContent = parseContent
  })

  $: shortContent = showEntire
    ? fullContent
    : truncate(
        fullContent
          .map(p => (Array.isArray(p) ? p[0] : p))
          .filter(p => !skipMedia || (isLink(p) && p.value.isMedia)),
        {
          minLength,
          maxLength,
          mediaLength: showMedia ? 200 : 50,
        },
      ).map((p, i) => (isImage(p) ? fullContent[i] : p))

  $: ellipsize = expandable && shortContent.map(c => (Array.isArray(c) ? c[0] : c)).find(isEllipsis)
</script>

<div
  class={cx($$props.class, "note-content overflow-hidden text-ellipsis")}
  style={ellipsize && "mask-image: linear-gradient(0deg, transparent 0px, black 100px)"}>
  {#each shortContent as parsed, i}
    {#if Array.isArray(parsed)}
      <ImageGrid images={parsed} />
    {:else if isNewline(parsed)}
      <NoteContentNewline value={parsed.value.slice(isNextToBlock(i) ? 1 : 0)} />
    {:else if isTopic(parsed)}
      <NoteContentTopic value={parsed.value} />
    {:else if isCode(parsed)}
      <NoteContentCode value={parsed.value} />
    {:else if isCashu(parsed)}
      <div on:click|stopPropagation>
        <QRCode code={parsed.value} />
      </div>
    {:else if isInvoice(parsed)}
      <div on:click|stopPropagation>
        <QRCode code={parsed.value} />
      </div>
    {:else if isLink(parsed)}
      <NoteContentLink value={parsed.value} showMedia={showMedia && isEnd(i)} />
    {:else if isProfile(parsed)}
      <PersonLink pubkey={parsed.value.pubkey} />
    {:else if isEvent(parsed) || isAddress(parsed)}
      {#if isStartOrEnd(i) && depth < 2}
        <NoteContentQuote {depth} {note} value={parsed.value}>
          <div slot="note-content" let:quote>
            <slot name="note-content" {quote} />
          </div>
        </NoteContentQuote>
      {:else}
        <Anchor
          modal
          stopPropagation
          class="overflow-hidden text-ellipsis whitespace-nowrap underline"
          href={fromNostrURI(parsed.raw)}>
          {fromNostrURI(parsed.raw).slice(0, 16) + "…"}
        </Anchor>
      {/if}
    {:else}
      {@html renderAsHtml(parsed)}
    {/if}
  {/each}
</div>

{#if ellipsize}
  <NoteContentEllipsis on:click={expand} />
{/if}
