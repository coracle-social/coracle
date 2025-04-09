<script lang="ts">
  import * as nip19 from "nostr-tools/nip19"
  import {tweened} from "svelte/motion"
  import {derived} from "svelte/store"
  import {sum, pluck, spec, nthEq, remove, uniqBy, prop} from "@welshman/lib"
  import {repository, Router} from "@welshman/app"
  import type {TrustedEvent, Handler} from "@welshman/util"
  import {LOCAL_RELAY_URL} from "@welshman/relay"
  import {
    isReplaceable,
    Address,
    toNostrURI,
    getPubkeyTagValues,
    ZAP_RESPONSE,
  } from "@welshman/util"
  import {fly} from "src/util/transition"
  import {copyToClipboard} from "src/util/html"
  import {isLike, replyKinds} from "src/util/nostr"
  import {formatSats, quantify} from "src/util/misc"
  import {showInfo} from "src/partials/Toast.svelte"
  import Field from "src/partials/Field.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import CopyValue from "src/partials/CopyValue.svelte"
  import PersonBadge from "src/app/shared/PersonBadge.svelte"
  import HandlerCard from "src/app/shared/HandlerCard.svelte"
  import RelayCard from "src/app/shared/RelayCard.svelte"
  import {deriveValidZaps} from "src/app/util"
  import {env, trackerStore, sortEventsDesc} from "src/engine"
  import {getHandlerKey, readHandlers, displayHandler} from "src/domain"

  export let event: TrustedEvent
  export let children: TrustedEvent[] = []
  export let handlers: Handler[] = []

  const relays = Router.get().Event(event).limit(3).getUrls()
  const nevent = nip19.neventEncode({id: event.id, kind: event.kind, author: event.pubkey, relays})
  const naddr = Address.fromEvent(event, relays).toNaddr()
  const interpolate = (a, b) => t => a + Math.round((b - a) * t)
  const mentions = getPubkeyTagValues(event.tags)
  const likesCount = tweened(0, {interpolate})
  const zapsTotal = tweened(0, {interpolate})
  const repliesCount = tweened(0, {interpolate})
  const handlerId = String(event.tags.find(nthEq(0, "client"))?.[2] || "")
  const handlerEvent = handlerId ? repository.getEvent(handlerId) : null
  const seenOn = derived(trackerStore, $t =>
    remove(LOCAL_RELAY_URL, Array.from($t.getRelays(event.id))),
  )

  const showHandlers = () => {
    handlersShown = true
  }

  const hideHandlers = () => {
    handlersShown = false
  }

  const copyJson = () => {
    copyToClipboard(json)
    showInfo(`Event JSON copied to clipboard!`)
  }

  let handlersShown = false

  $: json = JSON.stringify(event, null, 2)
  $: likes = uniqBy(prop("pubkey"), children.filter(isLike))
  $: zaps = deriveValidZaps(children.filter(spec({kind: ZAP_RESPONSE})), event)
  $: replies = sortEventsDesc(children.filter(e => replyKinds.includes(e.kind)))
  $: $likesCount = likes.length
  $: $zapsTotal = sum(pluck("invoiceAmount", $zaps)) / 1000
  $: $repliesCount = replies.length
</script>

{#if $zaps.length > 0}
  <h1 class="staatliches text-2xl">Zapped By</h1>
  <div class="grid grid-cols-2 gap-2">
    {#each $zaps as zap}
      <div class="flex flex-col gap-1">
        <PersonBadge pubkey={zap.request.pubkey} />
        <span class="ml-16 text-sm text-neutral-600"
          >{formatSats(zap.invoiceAmount / 1000)} sats</span>
      </div>
    {/each}
  </div>
{/if}
{#if likes.length > 0}
  <h1 class="staatliches text-2xl">Liked By</h1>
  <div class="grid grid-cols-2 gap-2">
    {#each likes as like}
      <PersonBadge pubkey={like.pubkey} />
    {/each}
  </div>
{/if}
{#if $seenOn?.length > 0 && (env.PLATFORM_RELAYS.length === 0 || env.PLATFORM_RELAYS.length > 1)}
  <h1 class="staatliches text-2xl">Relays</h1>
  <p>This note was found on {quantify($seenOn.length, "relay")} below.</p>
  <div class="flex flex-col gap-2">
    {#each $seenOn as url}
      <RelayCard {url} />
    {/each}
  </div>
{/if}
{#if mentions.length > 0}
  <h1 class="staatliches text-2xl">In this conversation</h1>
  <p>{quantify(mentions.length, "person is", "people are")} tagged in this note.</p>
  <div class="grid grid-cols-2 gap-2">
    {#each mentions as pubkey}
      <PersonBadge {pubkey} />
    {/each}
  </div>
{/if}
{#if handlers.length > 0 || handlerEvent}
  <h1 class="staatliches text-2xl">Apps</h1>
  {#if handlerEvent}
    {@const [handler] = readHandlers(handlerEvent)}
    {#if handler}
      <p>This note was published using {displayHandler(handler)}.</p>
      <HandlerCard {handler} />
    {/if}
  {/if}
  {#if handlers.length > 0}
    <div class="flex justify-between">
      <p>
        This note can also be viewed using {quantify(handlers.length, "other nostr app")}.
      </p>
      {#if handlersShown}
        <Anchor underline on:click={hideHandlers}>Hide apps</Anchor>
      {:else}
        <Anchor underline on:click={showHandlers}>Show apps</Anchor>
      {/if}
    </div>
    {#if handlersShown}
      <div in:fly={{y: 20}}>
        <FlexColumn>
          {#each handlers as handler (getHandlerKey(handler))}
            <HandlerCard {handler} />
          {/each}
        </FlexColumn>
      </div>
    {/if}
  {/if}
{/if}
<h1 class="staatliches text-2xl">Details</h1>
{#if isReplaceable(event)}
  <CopyValue label="Link" value={toNostrURI(naddr)} />
{:else}
  <CopyValue label="Link" value={toNostrURI(nevent)} />
{/if}
<CopyValue label="Event ID" encode={nip19.noteEncode} value={event.id} />
<Field>
  <p slot="label">Event JSON</p>
  <div class="relative rounded bg-tinted-700 p-1">
    <pre class="overflow-auto text-xs"><code>{json}</code></pre>
    <Anchor circle class="absolute right-1 top-1 bg-neutral-800" on:click={copyJson}>
      <i class="fa fa-copy m-2" />
    </Anchor>
  </div>
</Field>
