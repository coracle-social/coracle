<script lang="ts">
  import {pubkey} from "@welshman/app"
  import {max, pluck, spec, uniq, formatTimestamp} from "@welshman/lib"
  import {Address, HIGHLIGHT, LONG_FORM, POLL, getTags, type TrustedEvent} from "@welshman/util"
  import NoteContentKind1 from "src/app/shared/NoteContentKind1.svelte"
  import PeopleAction from "./PeopleAction.svelte"

  export let context: TrustedEvent[]
  export let event: TrustedEvent

  const describeKind = (kind: number) => (kind === LONG_FORM ? "article" : "note")

  // Highlights that tag their target as a reply get resolved to it by NoteReducer, so they end up
  // as context rather than as replies, which is what would render them. Quote them below.
  $: highlights = context.filter(spec({kind: HIGHLIGHT}))
  $: highlightedByOthers =
    highlights.length > 0 && highlights.length === context.length && event.pubkey === $pubkey

  // Highlights that only tag their target as an address can't be resolved, so they show up on
  // their own. Use the address to figure out whether what was highlighted is ours.
  $: highlightedAddress =
    event.kind === HIGHLIGHT
      ? getTags("a", event.tags)
          .filter(t => Address.isAddress(t[1]))
          .map(t => Address.from(t[1]))
          .find(a => a.pubkey === $pubkey)
      : undefined
</script>

<div class="flex flex-col gap-2">
  <div class="flex items-center justify-between">
    {#if highlightedByOthers}
      <PeopleAction
        pubkeys={uniq(pluck("pubkey", highlights))}
        actionText="highlighted your {describeKind(event.kind)}" />
    {:else if highlightedAddress}
      <PeopleAction
        pubkeys={[event.pubkey]}
        actionText="highlighted your {describeKind(highlightedAddress.kind)}" />
    {:else if context.length === 0}
      <PeopleAction pubkeys={[event.pubkey]} actionText="mentioned you" />
    {:else if event.kind === POLL && event.pubkey === $pubkey}
      <PeopleAction pubkeys={uniq(pluck("pubkey", context))} actionText="responded to your poll" />
    {:else if event.pubkey === $pubkey}
      <PeopleAction pubkeys={uniq(pluck("pubkey", context))} actionText="replied to your note" />
    {:else}
      <PeopleAction
        pubkeys={uniq(pluck("pubkey", context))}
        actionText="replied to a note mentioning you" />
    {/if}
    <small>{formatTimestamp(max(pluck("created_at", [event, ...context])))}</small>
  </div>
  {#each highlights as highlight (highlight.id)}
    <div class="border-l-2 border-solid border-neutral-600 pl-4 text-sm text-neutral-100">
      <NoteContentKind1 note={highlight} />
    </div>
  {/each}
</div>
