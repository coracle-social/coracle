<script lang="ts">
  import {deriveZapper, deriveZapperForPubkey, pubkey} from "@welshman/app"
  import {
    uniq,
    identity,
    spec,
    groupBy,
    pluck,
    uniqBy,
    prop,
    max,
    sortBy,
    nthEq,
    sum,
  } from "@welshman/lib"
  import type {TrustedEvent} from "@welshman/util"
  import {REACTION, ZAP_RESPONSE, getLnUrl, getTagValue, zapFromEvent} from "@welshman/util"
  import {repostKinds} from "src/util/nostr"
  import Icon from "src/partials/Icon.svelte"
  import PersonLink from "src/app/shared/PersonLink.svelte"
  import PersonCircles from "src/app/shared/PersonCircles.svelte"
  import PeopleAction from "./PeopleAction.svelte"
  import {formatTimestamp} from "src/util/misc"

  export let context: TrustedEvent[]
  export let event: TrustedEvent
  export let kind: "reactions" | "interactions" = "reactions"

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
</script>

{#if kind === "interactions"}
  <div class="flex items-center justify-between">
    {#if context.length === 0}
      <PeopleAction pubkeys={[event.pubkey]} actionText="mentioned you" />
    {:else if event.pubkey === $pubkey}
      <PeopleAction pubkeys={uniq(pluck("pubkey", context))} actionText="replied to your note" />
    {:else}
      <PeopleAction
        pubkeys={uniq(pluck("pubkey", context))}
        actionText="replied to a note mentioning you" />
    {/if}
    <small>{formatTimestamp(max(pluck("created_at", [event, ...context])))}</small>
  </div>
{/if}
{#if zaps.length > 0}
  {@const pubkeys = uniq(zaps.map(z => z.request.pubkey).filter(identity))}
  {#if pubkeys.length === 1}
    {@const {pubkey, content, created_at} = zaps[0].request}
    <div class="flex items-center justify-between">
      <p class="flex shrink-0 items-center gap-1 text-neutral-300">
        <Icon icon="bolt" />
        <strong>{zapsTotal}</strong> sats from
        <PersonLink {pubkey} />
        <i>{content.length > 30 ? content.slice(0, 30) + "..." : content}</i>
      </p>
      <small>{formatTimestamp(created_at)}</small>
    </div>
  {:else}
    <div class="flex flex-wrap items-center gap-1 text-neutral-300">
      <div class="flex items-center gap-1">
        <Icon icon="bolt" />
        <strong>{zapsTotal}</strong> sats from {pubkeys.length} people:
      </div>
      {#each groupBy(z => z.request.content, zaps) as [content, zapEvents] (content)}
        <div
          class="flex items-center gap-1 rounded-md border border-neutral-600-l bg-neutral-700-l text-sm">
          {content}
          <PersonCircles class="h-5 w-5" pubkeys={zapEvents.map(z => z.request.pubkey)} />
        </div>
      {/each}
    </div>
  {/if}
{/if}
{#if reposts.length > 0}
  {@const pubkeys = getPubkeys(reposts)}
  <p class="flex items-center gap-1 text-neutral-300">
    <i class="fa fa-rotate" />
    Reposted by
    {#if pubkeys.length === 1}
      <PersonLink pubkey={pubkeys[0]} />
    {:else}
      {pubkeys.length} people
    {/if}
  </p>
{/if}
{#if reactions.length > 0}
  {#if reactions.length === 1}
    {@const {pubkey, content, created_at} = reactions[0]}
    <div class="flex items-center justify-between">
      <p class="flex shrink-0 flex-wrap items-center gap-1 text-neutral-300">
        <PersonLink {pubkey} />
        reacted with
        {#if content === "+"}
          <Icon icon="heart" />
        {:else}
          {content}
        {/if}
      </p>
      <small>{formatTimestamp(created_at)}</small>
    </div>
  {:else}
    <p class="flex flex-wrap items-center gap-1 text-neutral-300">
      {reactions.length} people reacted:
      {#each groupBy(e => e.content, reactions) as [content, events] (content)}
        <span
          class="flex items-center gap-1 rounded-md border border-neutral-600-l bg-neutral-700-l px-1 text-sm">
          {#if content === "+"}
            <Icon icon="heart" />
          {:else}
            {content}
          {/if}
          <PersonCircles class="h-5 w-5" pubkeys={getPubkeys(events)} />
        </span>
      {/each}
    </p>
  {/if}
{/if}
