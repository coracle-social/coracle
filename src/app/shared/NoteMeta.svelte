<script lang="ts">
  import {uniq, spec, groupBy, pluck, uniqBy, prop} from "@welshman/lib"
  import type {TrustedEvent} from "@welshman/util"
  import {REACTION, ZAP_RESPONSE} from "@welshman/util"
  import {repostKinds} from "src/util/nostr"
  import Icon from "src/partials/Icon.svelte"
  import PersonLink from "src/app/shared/PersonLink.svelte"
  import PersonCircles from "src/app/shared/PersonCircles.svelte"

  export let event: TrustedEvent
  export let context: TrustedEvent[]

  const getPubkeys = (events: TrustedEvent[]) => uniq(pluck("pubkey", events))

  $: reactions = uniqBy(prop("pubkey"), context.filter(spec({kind: REACTION})))
  $: reposts = context.filter(e => repostKinds.includes(e.kind))
  $: zaps = context.filter(spec({kind: ZAP_RESPONSE}))
</script>

{#if zaps.length > 0}
  {@const pubkeys = getPubkeys(zaps)}
  <p class="flex items-center gap-1 pb-2 text-sm text-neutral-300">
    <i class="fa fa-rotate" />
    Zapped by
    {#if pubkeys.length === 1}
      <PersonLink pubkey={pubkeys[0]} />
    {:else}
      {pubkeys.length} people
    {/if}
  </p>
{:else if reposts.length > 0}
  {@const pubkeys = getPubkeys(reposts)}
  <p class="flex items-center gap-1 pb-2 text-sm text-neutral-300">
    <i class="fa fa-rotate" />
    Reposted by
    {#if pubkeys.length === 1}
      <PersonLink pubkey={pubkeys[0]} />
    {:else}
      {pubkeys.length} people
    {/if}
  </p>
{:else if reactions.length > 0}
  <p class="flex items-center gap-1 pb-2 text-sm text-neutral-300">
    {#if reactions.length === 1}
      {@const {pubkey, content} = reactions[0]}
      <PersonLink {pubkey} />
      reacted with
      {#if content === "+"}
        <Icon icon="heart" />
      {:else}
        {content}
      {/if}
    {:else}
      {reactions.length} people reacted:
      {#each groupBy(e => e.content, reactions) as [content, events] (content)}
        <span class="flex items-center gap-1">
          {content}
          <PersonCircles class="h-5 w-5" pubkeys={getPubkeys(events)} />
        </span>
      {/each}
    {/if}
  </p>
{/if}
