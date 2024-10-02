<script lang="ts">
  import {fromNostrURI} from "@welshman/util"
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
  import Link from '@lib/components/Link.svelte'
  import ContentToken from '@app/components/ContentToken.svelte'
  import ContentCode from '@app/components/ContentCode.svelte'
  import ContentLinkInline from '@app/components/ContentLinkInline.svelte'
  import ContentLinkBlock from '@app/components/ContentLinkBlock.svelte'
  import ContentNewline from '@app/components/ContentNewline.svelte'
  import ContentQuote from '@app/components/ContentQuote.svelte'
  import ContentTopic from '@app/components/ContentTopic.svelte'
  import ContentMention from '@app/components/ContentMention.svelte'
  import {entityLink} from '@app/state'

  export let event
  export let minLength = 500
  export let maxLength = 700
  export let showEntire = false
  export let hideMedia = false
  export let expandable = true
  export let depth = 0

  const fullContent = parse(event)

  const expand = () => {
    showEntire = true
  }

  const isBoundary = (i: number) => {
    const parsed = fullContent[i]

    if (!parsed || isNewline(parsed)) return true
    if (isText(parsed)) return parsed.value.match(/^\s+$/)

    return false
  }

  const isStartAndEnd = (i: number) => Boolean(isBoundary(i - 1) && isBoundary(i + 1))

  const isStartOrEnd = (i: number) => Boolean(isBoundary(i - 1) || isBoundary(i + 1))

  const isBlock = (i: number) => {
    const parsed = fullContent[i]

    return isEvent(parsed) || isAddress(parsed) || isLink(parsed)
  }

  const isNextToBlock = (i: number) => isBlock(i - 1) || isBlock(i + 1)

  $: shortContent = showEntire
    ? fullContent
    : truncate(fullContent, {
        minLength,
        maxLength,
        mediaLength: hideMedia ? 20 : 200,
      })

  $: ellipsize = expandable && shortContent.find(isEllipsis)
</script>

<div class="relative">
  <div
    class="overflow-hidden text-ellipsis"
    style={ellipsize ? "mask-image: linear-gradient(0deg, transparent 0px, black 100px)" : ""}>
    {#each shortContent as parsed, i}
      {#if isNewline(parsed)}
        <ContentNewline value={parsed.value.slice(isNextToBlock(i) ? 1 : 0)} />
      {:else if isTopic(parsed)}
        <ContentTopic value={parsed.value} />
      {:else if isCode(parsed)}
        <ContentCode value={parsed.value} />
      {:else if isCashu(parsed) || isInvoice(parsed)}
        <ContentToken value={parsed.value} />
      {:else if isLink(parsed)}
        {#if isStartOrEnd(i) && !hideMedia}
          <ContentLinkBlock value={parsed.value} />
        {:else}
          <ContentLinkInline value={parsed.value} />
        {/if}
      {:else if isProfile(parsed)}
        <ContentMention value={parsed.value} />
      {:else if isEvent(parsed) || isAddress(parsed)}
        {#if isStartOrEnd(i) && depth < 2 && !hideMedia}
          <ContentQuote value={parsed.value} {depth}>
            <div slot="note-content" let:event>
              <svelte:self {hideMedia} {event} depth={depth + 1} />
            </div>
          </ContentQuote>
        {:else}
          <Link
            external
            class="overflow-hidden text-ellipsis whitespace-nowrap underline"
            href={entityLink(parsed.raw)}>
            {fromNostrURI(parsed.raw).slice(0, 16) + "…"}
          </Link>
        {/if}
      {:else}
        {@html renderParsed(parsed)}
      {/if}
    {/each}
  </div>
  {#if ellipsize}
    <div class="z-feature relative flex justify-center bg-gradient-to-t from-base-100 pt-12 -m-6">
      <button type="button" class="btn" on:click|stopPropagation|preventDefault={expand}>
        See more
      </button>
    </div>
  {/if}
</div>
