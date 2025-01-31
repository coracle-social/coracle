<script lang="ts">
  import {deriveZapper, deriveZapperForPubkey, formatTimestamp} from "@welshman/app"
  import {groupBy, identity, max, nthEq, pluck, prop, spec, sum, uniq, uniqBy} from "@welshman/lib"
  import {getLnUrl, REACTION, ZAP_RESPONSE, zapFromEvent, type TrustedEvent} from "@welshman/util"
  import {router} from "src/app/util"
  import PersonLink from "src/app/shared/PersonLink.svelte"
  import PersonCircles from "src/app/shared/PersonCircles.svelte"
  import Icon from "src/partials/Icon.svelte"
  import {repostKinds} from "src/util/nostr"
  import Anchor from "src/partials/Anchor.svelte"

  export let context: TrustedEvent[]
  export let event: TrustedEvent

  const getPubkeys = (events: TrustedEvent[]) => uniq(pluck("pubkey", events))

  $: reactions = uniqBy(prop("pubkey"), context.filter(spec({kind: REACTION})))
  $: reposts = context.filter(e => repostKinds.includes(e.kind))

  $: lnurl = getLnUrl(event.tags?.find(nthEq(0, "zap"))?.[1] || "")
  $: zapper = lnurl ? deriveZapper(lnurl) : deriveZapperForPubkey(event.pubkey)
  $: zaps = context
    .filter(spec({kind: ZAP_RESPONSE}))
    .map(e => ($zapper ? zapFromEvent(e, $zapper) : null))
    .filter(identity)
  $: zapsTotal = sum(pluck("invoiceAmount", zaps)) / 1000

  $: created_at = max(pluck("created_at", context))
</script>

<div>
  <small class="float-end">{formatTimestamp(created_at)}</small>
  <div class="text-sm">
    {#if zaps.length > 0}
      {@const pubkeys = uniq(zaps.map(z => z.request.pubkey).filter(identity))}
      {#if pubkeys.length === 1}
        {@const {pubkey, content} = zaps[0].request}
        <p class="flex shrink-0 items-center gap-1 text-neutral-300">
          <Icon icon="bolt" />
          <strong>{zapsTotal}</strong> sats from
          <PersonLink {pubkey} />
          <i>{content.length > 30 ? content.slice(0, 30) + "..." : content}</i>
        </p>
      {:else}
        <div class="flex flex-wrap items-center gap-1 text-neutral-300">
          <div class="flex items-center gap-1">
            <Icon icon="bolt" />
            <strong>{zapsTotal}</strong> sats from {pubkeys.length} people:
          </div>
          {#each groupBy(z => z.request.content, zaps) as [content, zapEvents] (content)}
            {@const pubkeys = zapEvents.map(z => z.request.pubkey)}
            <Anchor
              modal
              href={router.at("people/list").qp({pubkeys}).toString()}
              class="flex items-center gap-1 rounded-full bg-neutral-700-l px-2 py-1 text-sm">
              {#if !content}
                <Icon icon="heart" />
              {:else}
                {content}
              {/if}
              <PersonCircles class="h-5 w-5" {pubkeys} />
            </Anchor>
          {/each}
        </div>
      {/if}
    {/if}
    {#if reposts.length > 0}
      {@const pubkeys = getPubkeys(reposts)}
      <p class="mt-4 flex items-center gap-1 text-neutral-300 first:mt-0">
        <i class="fa fa-rotate" />
        Reposted by
        {#if pubkeys.length === 1}
          <PersonLink pubkey={pubkeys[0]} />
        {:else}
          <Anchor modal href={router.at("people/list").qp({pubkeys}).toString()}>
            {pubkeys.length} people
          </Anchor>
        {/if}
      </p>
    {/if}
    {#if reactions.length > 0}
      {#if reactions.length === 1}
        {@const {pubkey, content} = reactions[0]}
        <p class="mt-4 flex shrink-0 flex-wrap items-center gap-1 text-neutral-300 first:mt-0">
          <PersonLink {pubkey} />
          reacted with
          {#if content === "+"}
            <Icon icon="heart" />
          {:else}
            {content}
          {/if}
        </p>
      {:else}
        <p class="mt-4 flex flex-wrap items-center gap-1 text-neutral-300 first:mt-0">
          {reactions.length} people reacted:
          {#each groupBy(e => e.content, reactions) as [content, events] (content)}
            {@const pubkeys = getPubkeys(events)}
            <Anchor
              class="flex items-center gap-1 rounded-full bg-neutral-700-l px-2 py-1 text-sm"
              modal
              href={router.at("people/list").qp({pubkeys}).toString()}>
              {#if content === "+"}
                <Icon icon="heart" />
              {:else}
                {content}
              {/if}
              <PersonCircles class="h-5 w-5" {pubkeys} />
            </Anchor>
          {/each}
        </p>
      {/if}
    {/if}
  </div>
</div>
