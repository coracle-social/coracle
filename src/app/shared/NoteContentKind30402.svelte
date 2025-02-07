<script lang="ts">
  import cx from "classnames"
  import {deriveIsDeletedByAddress} from "@welshman/store"
  import {ctx, fromPairs} from "@welshman/lib"
  import {getTagValue, Address} from "@welshman/util"
  import {repository, pubkey} from "@welshman/app"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import CurrencySymbol from "src/partials/CurrencySymbol.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Chip from "src/partials/Chip.svelte"
  import NoteContentTopics from "src/app/shared/NoteContentTopics.svelte"
  import NoteContentKind1 from "src/app/shared/NoteContentKind1.svelte"
  import {router} from "src/app/util/router"
  import {commaFormat} from "src/util/misc"

  export let note
  export let showMedia = false
  export let showEntire = false

  const {title, summary, location, status} = fromPairs(note.tags)
  const [price, code = "SAT"] = getTagValue("price", note.tags)?.slice(1) || []
  const address = Address.fromEvent(note, ctx.app.router.Event(note).getUrls())
  const editLink = router.at("listings").of(address.toString()).at("edit").toString()
  const deleteLink = router.at("listings").of(address.toString()).at("delete").toString()
  const deleted = deriveIsDeletedByAddress(repository, note)

  const sendMessage = () => router.at("channels").of([$pubkey, note.pubkey]).push()
</script>

<FlexColumn>
  <div class="flex flex-col gap-2">
    <div class="flex justify-between gap-2 text-xl">
      <div class="flex items-center gap-3">
        <strong class={cx({"line-through": $deleted})}>
          {title}
        </strong>
        {#if note.pubkey === $pubkey && !$deleted}
          <Anchor modal stopPropagation href={editLink} class="flex items-center">
            <i class="fa fa-edit text-base text-neutral-200" />
          </Anchor>
          <Anchor modal stopPropagation href={deleteLink} class="flex items-center">
            <i class="fa fa-trash text-base text-neutral-200" />
          </Anchor>
        {:else if $deleted}
          <Chip danger small>Deleted</Chip>
        {:else if status === "sold"}
          <Chip danger small>Sold</Chip>
        {:else}
          <Chip small>Available</Chip>
        {/if}
      </div>
      <span class="whitespace-nowrap">
        <CurrencySymbol {code} />{commaFormat(price || 0)}
        {code}
      </span>
    </div>
    {#if location}
      <div class="flex items-center gap-2 text-sm text-neutral-300">
        <i class="fa fa-location-dot" />
        {location}
      </div>
    {/if}
    {#if summary !== note.content}
      <p class="text-neutral-200">{summary}</p>
    {/if}
    <div class="h-px bg-neutral-600" />
    <NoteContentKind1 {note} {showEntire} {showMedia} />
  </div>
  <NoteContentTopics {note} />
  {#if !$deleted}
    <div class="flex justify-center">
      <Anchor button accent on:click={sendMessage}>Make an offer</Anchor>
    </div>
  {/if}
</FlexColumn>
