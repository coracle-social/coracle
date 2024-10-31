<script lang="ts">
  import {fromNostrURI} from "@welshman/util"
  import {nthEq} from "@welshman/lib"
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
          <ContentNewline value={parsed.value.slice(1)} />
        {:else if isTopic(parsed)}
          <ContentTopic value={parsed.value} />
        {:else if isCode(parsed)}
          <ContentCode value={parsed.value} isBlock={isStartAndEnd(i)} />
        {:else if isCashu(parsed) || isInvoice(parsed)}
          <ContentToken value={parsed.value} />
        {:else if isLink(parsed)}
          {#if isStartOrEnd(i) && !hideMedia && $userSettingValues.show_media}
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
        {:else if isEllipsis(parsed) && expandInline}
          {@html renderParsed(parsed)}
          <button type="button" class="text-sm underline"> Read more </button>
        {:else}
          {@html renderParsed(parsed)}
        {/if}
      {/each}
    </div>
    {#if expandBlock}
      <div class="relative z-feature -mt-6 flex justify-center bg-gradient-to-t from-base-100 py-2">
        <button type="button" class="btn" on:click|stopPropagation|preventDefault={expand}>
          See more
        </button>
      </div>
    {/if}
  {/if}
</div>
