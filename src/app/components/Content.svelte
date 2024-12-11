<script lang="ts">
  import {fromNostrURI} from "@welshman/util"
  import {nthEq} from "@welshman/lib"
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
  } from "@welshman/content"
  import Link from "@lib/components/Link.svelte"
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import ContentToken from "@app/components/ContentToken.svelte"
  import ContentCode from "@app/components/ContentCode.svelte"
  import ContentLinkInline from "@app/components/ContentLinkInline.svelte"
  import ContentLinkBlock from "@app/components/ContentLinkBlock.svelte"
  import ContentNewline from "@app/components/ContentNewline.svelte"
  import ContentQuote from "@app/components/ContentQuote.svelte"
  import ContentTopic from "@app/components/ContentTopic.svelte"
  import ContentMention from "@app/components/ContentMention.svelte"
  import {entityLink, userSettingValues} from "@app/state"

  export let event
  export let minLength = 500
  export let maxLength = 700
  export let showEntire = false
  export let hideMedia = false
  export let expandMode = "block"
  export let quoteProps: Record<string, any> = {}
  export let depth = 0

  const fullContent = parse(event)

  const expand = () => {
    showEntire = true
  }

  const isBlock = (i: number) => {
    const parsed = fullContent[i]

    if (!parsed || hideMedia) return false

    if (isLink(parsed) && $userSettingValues.show_media && isStartOrEnd(i)) {
      return true
    }

    if ((isEvent(parsed) || isAddress(parsed)) && isStartOrEnd(i) && depth < 1) {
      return true
    }

    return false
  }

  const isBoundary = (i: number) => {
    const parsed = fullContent[i]

    if (!parsed || isNewline(parsed)) return true
    if (isText(parsed)) return Boolean(parsed.value.match(/^\s+$/))

    return false
  }

  const isStart = (i: number) => isBoundary(i - 1)

  const isEnd = (i: number) => isBoundary(i + 1)

  const isStartAndEnd = (i: number) => isStart(i) && isEnd(i)

  const isStartOrEnd = (i: number) => isStart(i) || isEnd(i)

  const ignoreWarning = () => {
    warning = null
  }

  let warning =
    $userSettingValues.hide_sensitive && event.tags.find(nthEq(0, "content-warning"))?.[1]

  $: shortContent = showEntire
    ? fullContent
    : truncate(fullContent, {
        minLength,
        maxLength,
        mediaLength: hideMedia ? 20 : 200,
      })

  $: hasEllipsis = shortContent.find(isEllipsis)
  $: expandInline = hasEllipsis && expandMode === "inline"
  $: expandBlock = hasEllipsis && expandMode === "block"
</script>

<div class="relative">
  {#if warning}
    <div class="card2 card2-sm bg-alt row-2">
      <Icon icon="danger" />
      <p>
        This note has been flagged by the author as "{warning}".<br />
        <Button class="link" on:click={ignoreWarning}>Show anyway</Button>
      </p>
    </div>
  {:else}
    <div
      class="overflow-hidden text-ellipsis break-words"
      style={expandBlock ? "mask-image: linear-gradient(0deg, transparent 0px, black 100px)" : ""}>
      {#each shortContent as parsed, i}
        {#if isNewline(parsed)}
          <ContentNewline value={parsed.value.slice(isBlock(i - 1) ? 1 : 0)} />
        {:else if isTopic(parsed)}
          <ContentTopic value={parsed.value} />
        {:else if isCode(parsed)}
          <ContentCode
            value={parsed.value}
            isBlock={isStartAndEnd(i) || parsed.value.includes("\n")} />
        {:else if isCashu(parsed) || isInvoice(parsed)}
          <ContentToken value={parsed.value} />
        {:else if isLink(parsed)}
          {#if isBlock(i)}
            <ContentLinkBlock value={parsed.value} />
          {:else}
            <ContentLinkInline value={parsed.value} />
          {/if}
        {:else if isProfile(parsed)}
          <ContentMention value={parsed.value} />
        {:else if isEvent(parsed) || isAddress(parsed)}
          {#if isBlock(i)}
            <ContentQuote {...quoteProps} value={parsed.value} {depth} {event}>
              <div slot="note-content" let:event>
                <svelte:self {quoteProps} {hideMedia} {event} depth={depth + 1} />
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
        {:else if isEllipsis(parsed) && expandInline}
          {@html renderAsHtml(parsed)}
          <button type="button" class="text-sm underline"> Read more </button>
        {:else}
          {@html renderAsHtml(parsed)}
        {/if}
      {/each}
    </div>
    {#if expandBlock}
      <div class="relative z-feature -mt-6 flex justify-center py-2">
        <button
          type="button"
          class="btn btn-neutral"
          on:click|stopPropagation|preventDefault={expand}>
          See more
        </button>
      </div>
    {/if}
  {/if}
</div>
