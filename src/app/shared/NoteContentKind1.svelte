<script lang="ts">
  import cx from "classnames"
  import {fromNostrURI} from "@welshman/util"
  import type {ParsedLinkValue} from "@welshman/content"
  import {
    parse,
    truncate,
    renderAsHtml,
    isText,
    isEmoji,
    isTopic,
    isCode,
    isCashu,
    isInvoice,
    isLink,
    isImage,
    isProfile,
    isEvent,
    isEllipsis,
    isAddress,
    isNewline,
    reduceLinks,
    isLinkGrid,
  } from "@welshman/content"
  import QRCode from "src/partials/QRCode.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import NoteContentNewline from "src/app/shared/NoteContentNewline.svelte"
  import NoteContentEllipsis from "src/app/shared/NoteContentEllipsis.svelte"
  import NoteContentEmoji from "src/app/shared/NoteContentEmoji.svelte"
  import NoteContentTopic from "src/app/shared/NoteContentTopic.svelte"
  import NoteContentCode from "src/app/shared/NoteContentCode.svelte"
  import NoteContentLinks from "src/app/shared/NoteContentLinks.svelte"
  import PersonLink from "src/app/shared/PersonLink.svelte"
  import NoteContentQuote from "src/app/shared/NoteContentQuote.svelte"
  import NoteCheckImages from "src/app/shared/NoteCheckImages.svelte"

  export let note
  export let minLength = 500
  export let maxLength = 1000
  export let showEntire = false
  export let showMedia = false
  export let expandable = true
  export let depth = 0

  const expand = () => {
    showEntire = true
  }

  const isBoundary = i => {
    const parsed = shortContent[i]

    if (!parsed || isNewline(parsed)) return true
    if (isText(parsed)) return Boolean(parsed.value.match(/^\s+$/))

    return false
  }

  const isEnd = i => isBoundary(i + 1)

  const isStartOrEnd = i => isBoundary(i - 1) || isBoundary(i + 1)

  const isBlock = (i: number) => {
    const parsed = fullContent[i]

    if (!parsed) return false
    if (isLink(parsed) || isLinkGrid(parsed)) return showMedia && !parsed.raw.match("^ws|coracle")

    return isEvent(parsed) || isAddress(parsed)
  }

  const isNextToBlock = (i: number) => isBlock(i - 1) || isBlock(i + 1)

  const getUrls = (links: ParsedLinkValue[]) => links.map(link => link.url.toString())

  $: rawContent = parse(note)
  $: fullContent = showMedia ? reduceLinks(rawContent) : rawContent
  $: shortContent = showEntire
    ? fullContent
    : truncate(fullContent, {
        minLength,
        maxLength,
        mediaLength: showMedia ? 200 : 50,
      })

  $: mediaUrls = rawContent.filter(isImage).map(p => p.value.url.toString())
  $: ellipsize = expandable && shortContent.find(isEllipsis)
</script>

<NoteCheckImages author={note.pubkey} urls={mediaUrls}>
  <div
    class={cx($$props.class, "note-content overflow-hidden text-ellipsis")}
    style={ellipsize &&
      "mask-origin: border-box; mask-size: cover; mask-repeat: no-repeat; mask-image: linear-gradient(0deg, transparent 0px, black 100px)"}>
    {#each shortContent as parsed, i}
      {#if isNewline(parsed)}
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
        <NoteContentLinks urls={getUrls([parsed.value])} showMedia={showMedia && isEnd(i)} />
      {:else if isLinkGrid(parsed)}
        <NoteContentLinks urls={getUrls(parsed.value.links)} {showMedia} />
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
      {:else if isEmoji(parsed)}
        <NoteContentEmoji {...parsed.value} />
      {:else}
        {@html renderAsHtml(parsed)}
      {/if}
    {/each}
  </div>
  {#if ellipsize}
    <NoteContentEllipsis on:click={expand} />
  {/if}
</NoteCheckImages>
